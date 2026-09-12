import { Op, Sequelize } from "sequelize";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { User, Member, Role, Attendance } from "../models";

export class ExportService {
  static async generateFclExcel(
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("FCL Attendance");

    // Build title text
    const startDate = dayjs(`${startYear}-${startMonth}-01`);
    const endDate = dayjs(`${endYear}-${endMonth}-01`);
    const isSingleMonth = startMonth === endMonth && startYear === endYear;
    const titleText = isSingleMonth
      ? `FCL Attendance Report: ${startDate.format("MMMM YYYY")}`
      : `FCL Attendance Report: ${startDate.format("MMM YYYY")} - ${endDate.format("MMM YYYY")}`;

    // Row 1: Merged big title
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = titleText;
    titleCell.font = { bold: true, size: 16, color: { argb: "FF1A1A2E" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 40;

    // Row 2: Spacer
    sheet.getRow(2).height = 10;

    // Row 3: Column headers
    const headers = ["Leader Name", "Member Name", "Grade", "Gender", "Present", "Absent", "Month", "Year"];
    const headerRow = sheet.getRow(3);
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4361EE" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF333333" } },
        bottom: { style: "thin", color: { argb: "FF333333" } },
        left: { style: "thin", color: { argb: "FF333333" } },
        right: { style: "thin", color: { argb: "FF333333" } },
      };
    });
    headerRow.height = 28;

    // Collect data for each month in the range
    let currentDate = startDate;
    let rowIndex = 4;

    while (currentDate.isBefore(endDate.add(1, "month"), "month")) {
      const month = currentDate.month() + 1;
      const year = currentDate.year();
      const monthLabel = currentDate.format("MMMM");

      const monthStart = currentDate.startOf("month").format("YYYY-MM-DD");
      const monthEnd = currentDate.endOf("month").format("YYYY-MM-DD");

      // Get all leaders with members
      const leaders = await User.findAll({
        attributes: ["id", "username", "grade", "gender"],
        include: [
          {
            model: Role,
            as: "roles",
            where: { name: { [Op.in]: ["leader"] } },
            attributes: [],
            through: { attributes: [] },
          },
          {
            model: Member,
            as: "members",
            attributes: ["id", "name", "grade", "gender"],
            through: { attributes: [] },
          },
        ],
      });

      const allMemberIds = leaders.flatMap((l: any) =>
        l.members.map((m: Member) => m.id)
      );

      const attendanceCounts = allMemberIds.length > 0
        ? await Attendance.findAll({
            attributes: [
              "memberId",
              "status",
              [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            where: {
              memberId: { [Op.in]: allMemberIds },
              status: { [Op.in]: [0, 1] },
              date: { [Op.between]: [monthStart, monthEnd] },
            },
            group: ["memberId", "status"],
            raw: true,
          })
        : [];

      for (const leader of leaders) {
        const leaderData = leader as any;
        for (const member of leaderData.members) {
          const presentRecord = (attendanceCounts as any[]).find(
            (p) => p.memberId === member.id && p.status === 0
          );
          const absentRecord = (attendanceCounts as any[]).find(
            (p) => p.memberId === member.id && p.status === 1
          );
          const presentCount = presentRecord ? parseInt(presentRecord.count, 10) : 0;
          const absentCount = absentRecord ? parseInt(absentRecord.count, 10) : 0;

          const row = sheet.getRow(rowIndex);
          row.getCell(1).value = leaderData.username;
          row.getCell(2).value = member.name;
          row.getCell(3).value = member.grade ?? leaderData.grade;
          row.getCell(4).value = member.gender ?? leaderData.gender;
          row.getCell(5).value = presentCount;
          row.getCell(6).value = absentCount;
          row.getCell(7).value = monthLabel;
          row.getCell(8).value = year;

          // Style data rows
          for (let c = 1; c <= 8; c++) {
            const cell = row.getCell(c);
            cell.font = { size: 10 };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin", color: { argb: "FF999999" } },
              bottom: { style: "thin", color: { argb: "FF999999" } },
              left: { style: "thin", color: { argb: "FF999999" } },
              right: { style: "thin", color: { argb: "FF999999" } },
            };
          }
          // Left-align names
          row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

          // Alternate row fill
          if (rowIndex % 2 === 0) {
            for (let c = 1; c <= 8; c++) {
              row.getCell(c).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8F9FA" },
              };
            }
          }

          rowIndex++;
        }
      }

      currentDate = currentDate.add(1, "month");
    }

    // Auto-width columns
    sheet.columns.forEach((col) => {
      let maxLen = 12;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const val = cell.value?.toString() || "";
        maxLen = Math.max(maxLen, val.length + 4);
      });
      col.width = Math.min(maxLen, 30);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
}
