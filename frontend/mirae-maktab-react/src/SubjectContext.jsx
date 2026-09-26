import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SUBJECTS, USER } from './data/mock.js';

const SubjectContext = createContext(null);

/** School mode: subjects fixed by class — switch only, never enroll/unenroll. */
export function SubjectProvider({ children }) {
  // Prefer subjects marked enrolled (class matrix); else all
  const classSubjects = useMemo(() => {
    const enrolled = SUBJECTS.filter((s) => s.enrolled);
    return enrolled.length ? enrolled : SUBJECTS;
  }, []);

  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = localStorage.getItem('miraemaktab-active-subject');
      if (saved && classSubjects.some((s) => s.id === saved)) return saved;
    } catch { /* ignore */ }
    return classSubjects[0]?.id || SUBJECTS[0]?.id;
  });

  const active = useMemo(
    () => classSubjects.find((s) => s.id === activeId) || classSubjects[0] || SUBJECTS[0],
    [classSubjects, activeId],
  );

  useEffect(() => {
    if (active) {
      try { localStorage.setItem('miraemaktab-active-subject', active.id); } catch { /* ignore */ }
    }
  }, [active]);

  const setActive = (id) => {
    if (classSubjects.some((s) => s.id === id)) setActiveId(id);
  };

  const value = {
    subjects: classSubjects,
    enrolled: classSubjects,
    active,
    activeId: active?.id,
    setActive,
    enroll: () => {},
    unenroll: () => {},
    chooseSubjects: () => {},
    grade: USER.grade,
  };

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
}

export function useSubject() {
  const ctx = useContext(SubjectContext);
  if (!ctx) throw new Error('useSubject must be used within SubjectProvider');
  return ctx;
}
