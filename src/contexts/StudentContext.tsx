import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Auto-select the first student when students are loaded
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  // Clear selected student when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedStudent(null);
    }
  }, [user]);

  // Determine if this is a parent viewing student data
  // Parents have students associated with their user_id
  const isParentView = hasStudents;

  return (
    <StudentContext.Provider
      value={{
        selectedStudent,
        setSelectedStudent,
        students,
        isLoading,
        hasStudents,
        isParentView,
      }}
    >
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
