  private async getAttendance(req: AuthenticatedRequest, res: Response) {
    const leaderId = req.user!.userId;
    const { date } = req.query;

    if (!leaderId) {
      return res.status(401).json({ error: "Unathourized" });
    }
    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "Date query parameter is required" });
    }
    const validateDate = dayjs(date, "YYYY-MM-DD");
    if (!validateDate.isValid()) {
      return res
        .status(400)
        .json({ error: "Invalid date Format. please use YYYY-MM-DD" });
    }
    const formattedDate = validateDate.format("YYYY-MM-DD");
    try {
      const leader = await User.findByPk(leaderId, {
        include: [{ model: Member, as: "members" }],
      });
      if (!leader) {
        return res.status(404).json({ error: "Leader not found" });
      }
      const members = (leader as any).members || [];
      const memberIds = members.map((m: Member) => m.id);
      const existingAttendances = await Attendance.findAll({
        where: {
          memberId: { [Op.in]: memberIds },
          leaderId,
          date: formattedDate,
        },
      });
      const attendanceSheet = members.map((member: Member) => {
        const attendanceRecord = existingAttendances.find(
          (a) => a.memberId === member.id
        );
        return {
          memberId: member.id,
          name: member.name,
          grade: member.grade,
          gender: member.gender,
          // Jika sudah ada catatan, gunakan statusnya. Jika tidak, default-nya 'absent'.
          status: attendanceRecord ? attendanceRecord.status : "absent",
        };
      });
      res.json(attendanceSheet);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch attendance sheet" });
    }
  }

  @Post("attendance")
  @Middleware(authMiddleware)
  private async postAttendance(req: AuthenticatedRequest, res: Response) {
    const leaderId = req.user!.userId;
    const { date, attendances } = req.body;
    if (!leaderId) {
      return res.status(401).json({ error: "Unathourized" });
    }
    if (!date || !Array.isArray(attendances)) {
      return res
        .status(400)
        .json({ error: "Date and an array of attendances are required" });
    }
    try {
      await Promise.all(
        attendances.map(
          (att: { memberId: number; status: "present" | "absent" }) =>
            Attendance.upsert({
              leaderId,
              memberId: att.memberId,
              date,
              status: att.status,
            })
        )
      );
      res.status(200).json({message:'Attendance submitted successfully'})
    } catch (err) {
      console.log(err);
      res.status(500).json({error:'Failed to submit Attendances'})
    }
  }