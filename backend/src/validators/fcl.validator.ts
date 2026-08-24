import { z } from "zod";

export const addMembersSchema = z.object({
  body: z.object({
    membersData: z.array(
      z.object({
        name: z.string().min(1, "Name is required"),
        grade: z.union([z.string(), z.number()]).transform(val => Number(val)),
        gender: z.string().min(1, "Gender is required"),
        dob: z.string().nullable().optional(),
        phoneNumber: z.string().nullable().optional(),
      })
    ).min(1, "At least one member is required"),
  }),
});

export const editMemberSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    dob: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
  }).refine(data => data.name !== undefined || data.dob !== undefined || data.phoneNumber !== undefined, {
    message: "At least one field (name, dob, phoneNumber) must be provided to update",
  }),
});
