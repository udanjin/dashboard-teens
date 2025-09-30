export interface UserInfo {
  name: string;      // The property required by DashboardHeader
  username: string;
  roles?: string[];
  grade?:number,
  gender?:string,
  // Add any other user properties you need here
}