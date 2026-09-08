import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { FclService } from "../services/FclService";
import { addMembersSchema, editMemberSchema, fclSummarySchema, weeklyStatsSchema, requestDeleteSchema } from "../dtos/Fcl.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";
import { BadRequestError } from "../errors/AppError";

@Controller("api/fcl")
export class FclController {
  @Post("members")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_MEMBERS)])
  private async addMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Unauthorized");

      const { membersData } = addMembersSchema.parse(req.body);
      const result = await FclService.addMembers(leaderId, membersData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  @Put("members/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_MEMBERS)])
  private async editMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Unauthorized");

      const id = parseInt(req.params.id, 10);
      const data = editMemberSchema.parse(req.body);
      
      const member = await FclService.editMember(leaderId, id, data);
      res.json({ message: "Member updated successfully", member });
    } catch (err) {
      next(err);
    }
  }

  @Get("my-members")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW)])
  private async getMyMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Unauthorized");

      const members = await FclService.getMyMembers(leaderId);
      res.json(members);
    } catch (err) {
      next(err);
    }
  }

  @Get("fcl-summary")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW_SUMMARY)])
  private async getFclSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year } = fclSummarySchema.parse(req.query);
      const summaryData = await FclService.getFclSummary(month, year);
      res.json(summaryData);
    } catch (err) {
      next(err);
    }
  }

  @Get("weekly-stats")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW)])
  private async getFclWeeklyStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = weeklyStatsSchema.parse(req.query);
      const stats = await FclService.getFclWeeklyStats(filters);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  @Put("request-delete/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_MEMBERS)])
  private async requestDeleteMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = requestDeleteSchema.parse(req.body);
      await FclService.requestDeleteMember(id, reason);
      res.json({ message: "Deletion request submitted for approval." });
    } catch (err) {
      next(err);
    }
  }

  @Get("deletion-request")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async getDeletionRequest(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await FclService.getDeletionRequests();
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }

  @Delete("approve-deletion/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async approveDeleteMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await FclService.approveDeleteMember(id);
      res.json({ message: "Member deletion approved and completed." });
    } catch (err) {
      next(err);
    }
  }

  @Put("reject-deletion/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async rejectDeletion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await FclService.rejectDeletion(id);
      res.json({ message: "Deletion request has been rejected." });
    } catch (err) {
      next(err);
    }
  }

  @Get("birthdays")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.DASHBOARD_VIEW)])
  public async getBirthday(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const birthdays = await FclService.getBirthdays();
      res.json(birthdays);
    } catch (err) {
      next(err);
    }
  }
}

