import { useAuth } from "../../context/AuthContext";
import { Dashboard } from "../dashboard/Dashboard";
import { InstructorDashboard } from "../instructor/InstructorDashboard";
import { AdminDashboard } from "../admin/AdminDashboard";

export function AppDashboard() {
  const { learner } = useAuth();
  if (learner?.role === "admin") {
    return <AdminDashboard />;
  }
  if (learner?.role === "instructor") {
    return <InstructorDashboard />;
  }
  return <Dashboard />;
}
