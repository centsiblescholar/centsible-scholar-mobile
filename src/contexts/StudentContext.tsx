import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useParentStudents, StudentInfo } from '../hooks/useParentStudents';

interface StudentContextType {
  selectedStudent: StudentInfo | null;
  setSelectedStudent: (student: StudentInfo | null) => void;
  students: StudentInfo[];
  isLoading: boolean;
  hasStudents: boolean;
  isParentView: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { students, isLoading, hasStudents } = useParentStudents();
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

  // Auto-select the first student when students are loaded,
  // or reset if the selected student was removed/deactivated
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    } else if (selectedStudent && students.length > 0) {
      // Check if selectedStudent still exists in the active students list
      const stillExists = students.some(s => s.id === selectedStudent.id);
      if (!stillExists) {
        setSelectedStudent(students[0]);
      }
    } else if (students.length === 0 && selectedStudent) {
      setSelectedStudent(null);
    }
  }, [students]);

  // Clear selected student when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedStudent(null);
    }
  }, [user]);

  // Determine if this is a parent viewing student data
  // Parents have students associated with their user_id
  const isParentView = hasStudents;

  const value = useMemo(() => ({
    selectedStudent,
    setSelectedStudent,
    students,
    isLoading,
    hasStudents,
    isParentView,
  }), [selectedStudent, students, isLoading, hasStudents, isParentView]);

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
