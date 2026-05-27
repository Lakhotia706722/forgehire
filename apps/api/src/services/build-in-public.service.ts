import { getMongoDB } from "../config/mongodb";
import { v4 as uuidv4 } from "uuid";
import { Document, WithId } from "mongodb";

export interface BuildInPublicActivity {
  _id: string;
  engineerProfileId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export class BuildInPublicService {
  private collection = "build_in_public_activities";

  async postActivity(
    engineerProfileId: string,
    userId: string,
    content: string,
  ): Promise<BuildInPublicActivity> {
    const db = getMongoDB();

    const activity: BuildInPublicActivity = {
      _id: uuidv4(),
      engineerProfileId,
      userId,
      content,
      createdAt: new Date(),
    };

    await db
      .collection(this.collection)
      .insertOne(activity as unknown as Document);

    return activity;
  }

  async getActivitiesByEngineer(
    engineerProfileId: string,
    limit = 20,
    skip = 0,
  ): Promise<BuildInPublicActivity[]> {
    const db = getMongoDB();

    const docs = await db
      .collection(this.collection)
      .find({ engineerProfileId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs as unknown as BuildInPublicActivity[];
  }

  async getActivityFeed(
    limit = 50,
    skip = 0,
  ): Promise<BuildInPublicActivity[]> {
    const db = getMongoDB();

    const docs = await db
      .collection(this.collection)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return docs as unknown as BuildInPublicActivity[];
  }

  async deleteActivity(activityId: string, userId: string): Promise<void> {
    const db = getMongoDB();

    const result = await db.collection(this.collection).deleteOne({
      _id: activityId as unknown as WithId<Document>["_id"],
      userId,
    });

    if (result.deletedCount === 0) {
      throw new Error("Activity not found or unauthorized");
    }
  }

  async getActivityCount(engineerProfileId: string): Promise<number> {
    const db = getMongoDB();
    return await db
      .collection(this.collection)
      .countDocuments({ engineerProfileId });
  }
}
