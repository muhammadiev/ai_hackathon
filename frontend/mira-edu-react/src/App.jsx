import PaperTest from "./school/PaperTest.jsx";
import SubmissionCenter from "./school/SubmissionCenter.jsx";
import AITestBuilder from "./school/AITestBuilder.jsx";
import AIChat from "./school/AIChat.jsx";
import PsychManager from "./school/PsychManager.jsx";
import Settings from "./school/StaffSettings.jsx";
import DemoLogin from "./school/StaffLogin.jsx";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { useSchool } from "./school/SchoolContext.jsx";
import {
  Classes,
  ClassDetail,
  TeacherHomework,
  HomeworkBuilder,
  ReviewQueue,
  Materials,
  TeacherTimetable,
} from "./school/Teacher.jsx";
import HomeworkComposer from "./school/HomeworkComposer.jsx";
import HomeworkDetail from "./school/HomeworkDetail.jsx";
import HomeworkManager from "./school/HomeworkManager.jsx";
import { QuestionBank } from "./school/QuestionBank.jsx";
import { Workplan } from "./school/Workplan.jsx";
import {
  AdminUsers,
  AdminClasses,
  AdminTimetable,
  AdminTopics,
  Admissions,
  AdminPsych,
  AdminSettings,
  Audit,
} from "./school/Admin.jsx";
import { Notifications, Balance, Support } from "./school/Common.jsx";
import { StaffDashboard } from "./school/StaffDashboard.jsx";
import { QuestionEditor } from "./school/QuestionEditor.jsx";
import {
  UnderstandingFlags,
  Effectiveness,
  MasteryMap,
  ParentTips,
  CreatorPanel,
  DirectorPitch,
  PackMonitor,
} from "./school/Insights.jsx";
import { Page, Empty, Button } from "./school/ui.jsx";
import { useAuth } from "./AuthContext.jsx";
function Guard({ role, senior = false, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <Page title="Yuklanmoqda…">
        <Empty title="Sessiya tekshirilmoqda" text="Iltimos kuting." />
      </Page>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const effectiveRole = user.global_role || user.role;
  // Never trust client-only role toggles when API is on
  if (effectiveRole !== role) {
    return (
      <Navigate
        to={{ student: "/", teacher: "/t", admin: "/a" }[effectiveRole] || "/login"}
        replace
      />
    );
  }
  if (senior && user.classId && Number(String(user.classId).split("-")[0]) < 9)
    return <Navigate to="/" replace />;
  return children;
}
const teacher = (children) => <Guard role="teacher">{children}</Guard>;
const admin = (children) => <Guard role="admin">{children}</Guard>;
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<DemoLogin />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/t" replace />} />
        <Route path="/t" element={teacher(<StaffDashboard />)} />
        <Route path="/t/ai-test" element={teacher(<AITestBuilder />)} />
        <Route
          path="/t/ai-chat"
          element={teacher(<Navigate to="/t?chat=open" replace />)}
        />
        <Route path="/a/ai-chat" element={admin(<AIChat />)} />
        <Route path="/t/sinflar" element={teacher(<Classes />)} />
        <Route path="/t/sinf/:classId" element={teacher(<ClassDetail />)} />
        <Route path="/t/vazifalar" element={teacher(<HomeworkManager />)} />
        <Route
          path="/t/vazifalar/yangi"
          element={teacher(<HomeworkComposer />)}
        />
        <Route path="/t/vazifalar/:id" element={teacher(<HomeworkDetail />)} />
        <Route path="/t/vazifalar/:id/qogoz" element={teacher(<PaperTest />)} />
        <Route path="/t/topshirish" element={teacher(<SubmissionCenter />)} />
        <Route
          path="/a/integratsiyalar"
          element={admin(<SubmissionCenter admin />)}
        />
        <Route path="/t/ish-reja" element={teacher(<Workplan />)} />
        <Route
          path="/t/savollar/ai"
          element={teacher(<AITestBuilder key="teacher-bank" mode="bank" />)}
        />
        <Route
          path="/a/savollar/ai"
          element={admin(<AITestBuilder key="admin-bank" mode="bank" />)}
        />
        <Route path="/t/savollar" element={teacher(<QuestionBank />)} />
        <Route path="/t/savollar/yangi" element={teacher(<QuestionEditor />)} />
        <Route
          path="/t/savollar/:id/tahrirlash"
          element={teacher(<QuestionEditor />)}
        />
        <Route
          path="/t/amaliy"
          element={<Navigate to="/t/vazifalar?kind=practical" replace />}
        />
        <Route path="/t/tekshiruv" element={teacher(<ReviewQueue />)} />
        <Route path="/t/tekshiruv/:id" element={teacher(<ReviewQueue />)} />
        <Route path="/t/materiallar" element={teacher(<Materials />)} />
        <Route path="/t/jadval" element={teacher(<TeacherTimetable />)} />
        <Route path="/t/tushunish" element={teacher(<UnderstandingFlags />)} />
        <Route path="/t/samaradorlik" element={teacher(<Effectiveness />)} />
        <Route path="/t/mastery" element={teacher(<MasteryMap />)} />
        <Route path="/t/ota-ona" element={teacher(<ParentTips />)} />
        <Route path="/t/ijodkor" element={teacher(<CreatorPanel />)} />
        <Route path="/t/tolemalar" element={teacher(<PackMonitor />)} />
        <Route path="/t/direktor" element={teacher(<DirectorPitch />)} />
        <Route path="/t/balans" element={teacher(<Balance />)} />
        <Route
          path="/t/bildirishnomalar"
          element={teacher(<Notifications />)}
        />
        <Route path="/t/sozlamalar" element={teacher(<Settings />)} />
        <Route path="/a" element={admin(<StaffDashboard admin />)} />

        <Route path="/a/savollar" element={admin(<QuestionBank />)} />
        <Route path="/a/savollar/yangi" element={admin(<QuestionEditor />)} />
        <Route
          path="/a/savollar/:id/tahrirlash"
          element={admin(<QuestionEditor />)}
        />
        <Route path="/a/users" element={admin(<AdminUsers />)} />
        <Route path="/a/classes" element={admin(<AdminClasses />)} />
        <Route path="/a/timetable" element={admin(<AdminTimetable />)} />
        <Route path="/a/topics" element={admin(<AdminTopics />)} />
        <Route path="/a/admissions" element={admin(<Admissions />)} />
        <Route path="/a/psych" element={admin(<PsychManager />)} />
        <Route path="/a/payments" element={admin(<AdminSettings payments />)} />
        <Route path="/a/ai" element={admin(<AdminSettings />)} />
        <Route path="/a/audit" element={admin(<Audit />)} />
        <Route path="/a/sozlamalar" element={admin(<Settings />)} />
        <Route
          path="*"
          element={
            <Page title="Sahifa topilmadi">
              <Empty
                action={<Button to="/login">Demo rollarga qaytish</Button>}
              />
            </Page>
          }
        />
      </Route>
    </Routes>
  );
}
