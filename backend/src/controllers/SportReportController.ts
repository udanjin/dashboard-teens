import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import SportReport from '../models/SportReport';
import { createCipheriv } from 'crypto';

@Controller('api/sport-reports')
export class SportReportController {
  @Get('')
  private async getAllReports(req: Request, res: Response) {
    try {
      const reports = await SportReport.findAll();
      res.json(reports);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch sport reports' });
    }
  }
  @Get('cash-balance')
  private async getCash(req:Request, res:Response){
    try{
      const totalPemasukan = await SportReport.sum('totalPemasukan');
      const totalPengeluaran = await SportReport.sum('totalPengeluaran');
      const cashBalance = totalPemasukan - totalPengeluaran;
      res.json(cashBalance);
    }catch(err){
      console.error(err);
      res.status(500).json({ error: 'Failed to calculate cash balance' });
    }
  }

  @Post('')
  private async createReport(req: Request, res: Response) {
    try {
      const report = await SportReport.create(req.body);
      res.status(201).json(report);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: 'Failed to create sport report' });
    }
  }
  @Put(':id')
  private async updateReport(req:Request,res: Response){
    const {id} = req.params 
    try{
      const report = await SportReport.findByPk(id);
      if(!report){
        return res.status(404).json({error:'sport report not found'});
      }
      const updatedReport = await report.update(req.body);
      res.json(updatedReport);
    }catch (err){
      console.error(err);
      return res.status(400).json({error: 'Failed to update Report'})
    }
  }
  @Delete(':id')
    private async deleteReport(req: Request, res: Response ){
      const {id} = req.params;
      try{
        const report  = await SportReport.findByPk(id);
        if(!report){
          return res.status(404).json({error: 'sport report not found'});
        }
        await report.destroy();
        return res.status(200).json({message : 'Report berhasil di hapus'});
      }catch(err){
        console.error(err);
        return res.status(400).json({error: 'Failed to delete the report'});
      }
    }

}