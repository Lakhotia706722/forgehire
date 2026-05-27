import { PrismaClient } from "@prisma/client";

export class AvailabilityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Set availability slots (Calendly-style)
   */
  async setAvailabilitySlots(
    engineerProfileId: string,
    slots: Array<{
      startTime: Date;
      endTime: Date;
    }>,
  ) {
    // Validate slots
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        throw new Error("Start time must be before end time");
      }

      const duration =
        (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
      if (duration !== 30) {
        throw new Error("Slots must be exactly 30 minutes");
      }
    }

    // Create slots
    const createdSlots = await Promise.all(
      slots.map((slot) =>
        this.prisma.availabilitySlot.create({
          data: {
            engineerProfileId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            booked: false,
          },
        }),
      ),
    );

    return createdSlots;
  }

  /**
   * Get available slots for engineer
   */
  async getAvailableSlots(
    engineerProfileId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      engineerProfileId,
      booked: false,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = startDate;
      }
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }

    return await this.prisma.availabilitySlot.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
  }

  /**
   * Book a discovery call slot
   */
  async bookSlot(
    slotId: string,
    companyUserId: string,
    meetingLink?: string,
    meetingNotes?: string,
  ) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.booked) {
      throw new Error("Slot is already booked");
    }

    // Check if slot is in the past
    if (slot.startTime < new Date()) {
      throw new Error("Cannot book past slots");
    }

    return await this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        booked: true,
        bookedBy: companyUserId,
        meetingLink,
        meetingNotes,
      },
    });
  }

  /**
   * Cancel booked slot
   */
  async cancelSlot(slotId: string, userId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        engineerProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (!slot.booked) {
      throw new Error("Slot is not booked");
    }

    // Check authorization (either booker or engineer can cancel)
    if (slot.bookedBy !== userId && slot.engineerProfile.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        booked: false,
        bookedBy: null,
        meetingLink: null,
        meetingNotes: null,
      },
    });
  }

  /**
   * Get engineer's booked slots
   */
  async getEngineerBookedSlots(engineerProfileId: string) {
    return await this.prisma.availabilitySlot.findMany({
      where: {
        engineerProfileId,
        booked: true,
      },
      orderBy: { startTime: "asc" },
    });
  }

  /**
   * Get company's booked slots
   */
  async getCompanyBookedSlots(companyUserId: string) {
    return await this.prisma.availabilitySlot.findMany({
      where: {
        bookedBy: companyUserId,
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  /**
   * Delete availability slot
   */
  async deleteSlot(slotId: string, engineerUserId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        engineerProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.engineerProfile.userId !== engineerUserId) {
      throw new Error("Unauthorized");
    }

    if (slot.booked) {
      throw new Error("Cannot delete booked slot. Cancel it first.");
    }

    await this.prisma.availabilitySlot.delete({
      where: { id: slotId },
    });

    return { success: true };
  }

  /**
   * Generate weekly availability slots
   */
  async generateWeeklySlots(
    engineerProfileId: string,
    weekStart: Date,
    timeSlots: Array<{
      dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
      startHour: number;
      startMinute: number;
    }>,
  ) {
    const slots: Array<{ startTime: Date; endTime: Date }> = [];

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + day);

      const dayOfWeek = currentDate.getDay();

      const daySlots = timeSlots.filter((ts) => ts.dayOfWeek === dayOfWeek);

      for (const timeSlot of daySlots) {
        const startTime = new Date(currentDate);
        startTime.setHours(timeSlot.startHour, timeSlot.startMinute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        // Only add future slots
        if (startTime > new Date()) {
          slots.push({ startTime, endTime });
        }
      }
    }

    return await this.setAvailabilitySlots(engineerProfileId, slots);
  }
}
