import { getTaskRouteErrorStatus } from "../../routes/task.routes";

describe("task route error mapping", () => {
  it("maps unauthorized errors to 403", () => {
    expect(getTaskRouteErrorStatus("Unauthorized")).toBe(403);
    expect(getTaskRouteErrorStatus("Only engineers can participate in tasks")).toBe(403);
    expect(getTaskRouteErrorStatus("Unauthorized - only task creator can evaluate")).toBe(403);
  });

  it("maps missing resources to 404", () => {
    expect(getTaskRouteErrorStatus("Task not found")).toBe(404);
  });

  it("maps conflict-like winner flow errors to 409", () => {
    expect(getTaskRouteErrorStatus("Winner already selected for this task")).toBe(409);
    expect(getTaskRouteErrorStatus("Duplicate rank in winners payload")).toBe(409);
    expect(getTaskRouteErrorStatus("Submission abc is rejected")).toBe(409);
  });

  it("maps validation/default errors to 400", () => {
    expect(getTaskRouteErrorStatus("Contest ranks not configured")).toBe(400);
  });

  it("maps task state conflicts to 409", () => {
    expect(getTaskRouteErrorStatus("Completed or cancelled tasks cannot be updated")).toBe(409);
    expect(getTaskRouteErrorStatus("Task is already finalized")).toBe(409);
    expect(getTaskRouteErrorStatus("Task is not open for participation")).toBe(409);
    expect(getTaskRouteErrorStatus("Must participate before submitting")).toBe(409);
    expect(getTaskRouteErrorStatus("Task is not accepting submissions")).toBe(409);
    expect(getTaskRouteErrorStatus("Task is not accepting questions")).toBe(409);
    expect(getTaskRouteErrorStatus("NeuronScore 400 is below minimum required 600")).toBe(409);
    expect(getTaskRouteErrorStatus("You can retake this mini-gate test after 24 hours")).toBe(409);
  });
});
