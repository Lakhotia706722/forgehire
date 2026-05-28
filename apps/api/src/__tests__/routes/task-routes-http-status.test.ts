import Fastify from "fastify";
import { taskRoutes } from "../../routes/task.routes";

const selectWinnerMock = jest.fn();
const selectMultipleWinnersMock = jest.fn();
const participateInTaskMock = jest.fn();
const evaluateSubmissionMock = jest.fn();
const generateNDAMock = jest.fn();
const signNDAMock = jest.fn();
const getTaskMock = jest.fn();
const startMiniGateTestMock = jest.fn();
const submitMiniGateTestMock = jest.fn();
const taskSubmissionFindUniqueMock = jest.fn();

jest.mock("../../config/mongodb", () => ({
  getMongoDB: jest.fn(() => ({
    collection: jest.fn(() => ({
      aggregate: jest.fn(() => ({
        toArray: jest.fn(async () => []),
      })),
    })),
  })),
}));

jest.mock("../../middleware/auth", () => ({
  authenticate: jest.fn(async (request: any) => {
    request.user = { userId: "company-user-1", role: "company" };
  }),
  requireRole: jest.fn(() => async () => {}),
  tryAuthenticate: jest.fn(async () => {}),
}));

jest.mock("../../services/task.service", () => ({
  TaskService: jest.fn().mockImplementation(() => ({
    createTask: jest.fn(),
    updateTask: jest.fn(),
    createEscrowOrder: jest.fn(),
    closeTask: jest.fn(),
    depositEscrow: jest.fn(),
    getEngineerSubmissions: jest.fn(),
    getCompanyTasks: jest.fn(),
    getTaskFeed: jest.fn(),
    getTask: getTaskMock,
    participateInTask: participateInTaskMock,
    approveParticipation: jest.fn(),
    rejectParticipation: jest.fn(),
    submitTask: jest.fn(),
    evaluateSubmission: evaluateSubmissionMock,
    selectWinner: selectWinnerMock,
    selectMultipleWinners: selectMultipleWinnersMock,
    askQuestion: jest.fn(),
    answerQuestion: jest.fn(),
    generateNDA: generateNDAMock,
    signNDA: signNDAMock,
    startMiniGateTest: startMiniGateTestMock,
    submitMiniGateTest: submitMiniGateTestMock,
    prisma: {
      user: { findUnique: jest.fn() },
      task: { findUnique: jest.fn() },
      taskSubmission: { findUnique: taskSubmissionFindUniqueMock, update: jest.fn() },
      engineerProfile: { findUnique: jest.fn() },
      miniGateTest: { update: jest.fn() },
    },
  })),
}));

describe("task routes HTTP status mapping", () => {
  const submissionId = "550e8400-e29b-41d4-a716-446655440000";

  async function buildApp() {
    const app = Fastify();
    await app.register(taskRoutes, { prefix: "/api" });
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    taskSubmissionFindUniqueMock.mockResolvedValue(null);
    getTaskMock.mockResolvedValue({ category: ["AI"] });
  });

  it("maps winner route unauthorized error to 403", async () => {
    const app = await buildApp();
    selectWinnerMock.mockRejectedValueOnce(
      new Error("Unauthorized - only task creator can evaluate"),
    );

    const response = await app.inject({
      method: "PUT",
      url: "/api/tasks/task-1/winner",
      payload: { submissionId, rank: 1 },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Unauthorized - only task creator can evaluate",
    });

    await app.close();
  });

  it("maps winner route conflict error to 409", async () => {
    const app = await buildApp();
    selectWinnerMock.mockRejectedValueOnce(
      new Error("Winner already selected for this task"),
    );

    const response = await app.inject({
      method: "PUT",
      url: "/api/tasks/task-1/winner",
      payload: { submissionId, rank: 1 },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Winner already selected for this task",
    });

    await app.close();
  });

  it("maps multi-winner not-found error to 404", async () => {
    const app = await buildApp();
    selectMultipleWinnersMock.mockRejectedValueOnce(new Error("Task not found"));

    const response = await app.inject({
      method: "PUT",
      url: "/api/tasks/task-1/winners",
      payload: {
        winners: [{ submissionId, rank: 1 }],
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Task not found",
    });

    await app.close();
  });

  it("maps unknown multi-winner validation error to 400", async () => {
    const app = await buildApp();
    selectMultipleWinnersMock.mockRejectedValueOnce(
      new Error("Contest ranks not configured"),
    );

    const response = await app.inject({
      method: "PUT",
      url: "/api/tasks/task-1/winners",
      payload: {
        winners: [{ submissionId, rank: 1 }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Contest ranks not configured",
    });

    await app.close();
  });

  it("maps participate route role restriction error to 403", async () => {
    const app = await buildApp();
    participateInTaskMock.mockRejectedValueOnce(
      new Error("Only engineers can participate in tasks"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/tasks/task-1/participate",
      payload: {
        approach:
          "I will deliver this feature with tests, clear milestones, rollout checks, and monitoring.",
        estimatedTime: 6,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Only engineers can participate in tasks",
    });

    await app.close();
  });

  it("maps participate route gating conflict to 409", async () => {
    const app = await buildApp();
    participateInTaskMock.mockRejectedValueOnce(
      new Error("Task is not open for participation"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/tasks/task-1/participate",
      payload: {
        approach:
          "I will deliver this feature with tests, clear milestones, rollout checks, and monitoring.",
        estimatedTime: 6,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Task is not open for participation",
    });

    await app.close();
  });

  it("maps evaluate route finalized submission conflict to 409", async () => {
    const app = await buildApp();
    taskSubmissionFindUniqueMock.mockResolvedValueOnce({
      id: submissionId,
      status: "winner",
      task: { id: "task-1", userId: "company-user-1", companyProfileId: "cp-1" },
      engineerProfile: { id: "ep-1" },
    });

    const response = await app.inject({
      method: "POST",
      url: `/api/tasks/task-1/submissions/${submissionId}/evaluate`,
      payload: {
        submissionId,
        score: 88,
        feedback: "Needs a clearer architecture rationale and stronger tests.",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Submission already finalized with status: winner",
    });

    await app.close();
  });

  it("maps evaluate route not-found to 404", async () => {
    const app = await buildApp();
    evaluateSubmissionMock.mockRejectedValueOnce(new Error("Submission not found"));

    const response = await app.inject({
      method: "POST",
      url: `/api/tasks/task-1/submissions/${submissionId}/evaluate`,
      payload: {
        submissionId,
        score: 80,
        feedback: "Needs better edge-case handling.",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Submission not found",
    });

    await app.close();
  });

  it("maps nda sign already-signed conflict to 409", async () => {
    const app = await buildApp();
    signNDAMock.mockRejectedValueOnce(new Error("NDA already signed"));

    const response = await app.inject({
      method: "POST",
      url: "/api/tasks/task-1/nda/sign",
      payload: {
        signature: "Arjun Sharma",
        signatureType: "typed",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "NDA already signed",
    });

    await app.close();
  });

  it("maps nda generate engineer profile missing to 404", async () => {
    const app = await buildApp();
    generateNDAMock.mockRejectedValueOnce(new Error("Engineer profile not found"));

    const response = await app.inject({
      method: "POST",
      url: "/api/tasks/task-1/nda/generate",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Engineer profile not found",
    });

    await app.close();
  });

  it("maps mini-gate submit cooldown conflict to 409", async () => {
    const app = await buildApp();
    submitMiniGateTestMock.mockRejectedValueOnce(
      new Error("You can retake this mini-gate test after 24 hours"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/tasks/task-1/gate-submit",
      payload: {
        testId: "550e8400-e29b-41d4-a716-446655440001",
        answers: [{ questionId: "q1", selectedOption: 2 }],
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "You can retake this mini-gate test after 24 hours",
    });

    await app.close();
  });

  it("maps gate-questions missing task to 404", async () => {
    const app = await buildApp();
    getTaskMock.mockRejectedValueOnce(new Error("Task not found"));

    const response = await app.inject({
      method: "GET",
      url: "/api/tasks/task-1/gate-questions",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      error: "Task not found",
    });

    await app.close();
  });

  it("maps gate-questions retake cooldown to 409", async () => {
    const app = await buildApp();
    startMiniGateTestMock.mockRejectedValueOnce(
      new Error("You can retake this mini-gate test after 24 hours"),
    );

    const response = await app.inject({
      method: "GET",
      url: "/api/tasks/task-1/gate-questions",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      success: false,
      error: "You can retake this mini-gate test after 24 hours",
    });

    await app.close();
  });
});
