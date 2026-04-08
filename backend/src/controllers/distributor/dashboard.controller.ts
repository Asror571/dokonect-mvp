import { Request, Response } from 'express';
import { AnalyticsService } from '../../services/analytics.service';

const analyticsService = new AnalyticsService();

export class DashboardController {
  // ANA-01: Get dashboard stats
  async getStats(req: Request, res: Response) {
    try {
      const distributorId = (req as any).user.distributorId;
      const stats = await analyticsService.getDashboardStats(distributorId);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ANA-02: Get sales report
  async getSalesReport(req: Request, res: Response) {
    try {
      const distributorId = (req as any).user.distributorId;
      const report = await analyticsService.getSalesReport(distributorId, req.query);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ANA-02: Get sales trend
  async getSalesTrend(req: Request, res: Response) {
    try {
      const distributorId = (req as any).user.distributorId;
      const period = (req.query.period as any) || 'day';
      const trend = await analyticsService.getSalesTrend(distributorId, period);
      res.json(trend);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ANA-03: Get profit/loss report
  async getProfitLoss(req: Request, res: Response) {
    try {
      const distributorId = (req as any).user.distributorId;
      const report = await analyticsService.getProfitLossReport(distributorId, req.query);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get delivery stats
  async getDeliveryStats(req: Request, res: Response) {
    try {
      const distributorId = (req as any).user.distributorId;
      const stats = await analyticsService.getDeliveryStats(distributorId);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
