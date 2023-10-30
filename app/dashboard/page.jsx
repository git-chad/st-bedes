"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Subjects } from "../components/dashboard-module/ui/subjects";
import { Teachers } from "@/app/components/dashboard-module/ui/teachers";
import { Children } from "../components/dashboard-module/ui/children";
import {
  getStudentQuestion,
  getParentQuestion,
} from "@/app/core/services/api/questions";
import { useRouter } from "next/navigation";
import { useCategorizedQuestions } from "../core/hooks/useCategorizedQuestions";
import Navbar from "../components/navbar-module/navbar";
import SpinnerBlack from "../components/spinner-component/spinnerBlack";

const DashboardPage = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(sessionStorage.getItem("user"))
  );
  const userType = user.student_id ? "student" : "parent";
  const userId = user.student_id || user.parent_id;
  const router = useRouter();

  const [surveys, setSurveys] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorizedQuestions = useCategorizedQuestions(surveys, userType);
  const academicSurveys = categorizedQuestions.studentSurveys.academicSurveys;
  const allParentSurveys = useMemo(
    () => [
      ...categorizedQuestions.parentSurveys.sectionA,
      ...categorizedQuestions.parentSurveys.sectionB,
      ...categorizedQuestions.parentSurveys.sectionC,
    ],
    [categorizedQuestions]
  );

  const uniqueChildren = useMemo(() => {
    const allChildren = allParentSurveys.map((survey) => ({
      id: survey.student_id,
      name: survey.student_full_name,
    }));
    return Array.from(new Set(allChildren.map((child) => child.id))).map((id) =>
      allChildren.find((child) => child.id === id)
    );
  }, [allParentSurveys]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (userType === "student") {
          data = await getStudentQuestion(userId);
        } else if (userType === "parent") {
          data = await getParentQuestion(userId);
        }

        setSurveys(data.response.questions || []);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
        console.error("dashboard fetch data error:", error);
      }
    };

    fetchData();
  }, [userId, userType]);

  useEffect(() => {
    if (selectedSubject && selectedTeacher) {
      const surveyId = `${selectedSubject}-${selectedTeacher}`;
      router.push(`/dashboard/${surveyId}`);
    } else if (userType === "parent" && selectedChild) {
      router.push(`/dashboard/${selectedChild.id}`);
    }
  }, [userType, selectedTeacher, selectedSubject, selectedChild, router]);

  const resetSubjectSelection = () => {
    setSelectedSubject(null);
    setSelectedTeacher(null);
  };

  const content = useMemo(() => {
    if (userType === "student") {
      return (
        <>
          <h2 className="font-bold text-2xl">School</h2>
          <button>School survey</button>
          <h2 className="font-bold text-2xl">Academic</h2>
          {!selectedSubject && (
            <Subjects surveys={academicSurveys} onSelect={setSelectedSubject} />
          )}
          {selectedSubject && !selectedTeacher && (
            <>
              <Teachers
                subject={selectedSubject}
                surveys={academicSurveys}
                onSelect={setSelectedTeacher}
              />
              <button
                onClick={resetSubjectSelection}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
              >
                Choose a different subject
              </button>
            </>
          )}
        </>
      );
    } else if (userType === "parent") {
      return (
        <>
          <h2 className="font-bold text-2xl">Select a Child</h2>
          <Children surveys={uniqueChildren} onSelect={setSelectedChild} />
        </>
      );
    }
  }, [
    userType,
    academicSurveys,
    selectedSubject,
    selectedTeacher,
    uniqueChildren,
  ]);

  if (error) return <p>Oops, something unexpected happened: {error}</p>;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <Navbar />
      {loading && <SpinnerBlack />}
      {!loading && <div>{content}</div>}
    </div>
  );
};

export default DashboardPage;
