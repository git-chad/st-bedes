"use client";
import { useDecodedSurveyId } from "@/app/core/hooks/useDecodedSurveyId";
import { useState, useEffect } from "react";
import {
  getStudentQuestion,
  getParentQuestion,
} from "@/app/core/services/api/questions";
import Questionnaire from "@/app/components/dashboard-module/surveys/questionnaire";
import { useCategorizedQuestions } from "@/app/core/hooks/useCategorizedQuestions";
import { useFilterQuestions } from "@/app/core/hooks/useFilterQuestions";
import SpinnerBlack from "@/app/components/spinner-component/spinnerBlack";
import Navbar from "@/app/components/navbar-module/navbar";

const SurveyPage = () => {
  const isBrowser = typeof window !== "undefined";

  const [user, setUser] = useState(() => {
    if (isBrowser) {
      return JSON.parse(sessionStorage.getItem("user"));
    }
    return {};
  });
  const userType = user.student_id ? "student" : "parent";
  const userId = user.student_id || user.parent_id;
  const { subject, teacher, child } = useDecodedSurveyId();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      let data;

      if (userType === "student") {
        data = await getStudentQuestion(userId);
      } else if (userType === "parent") {
        data = await getParentQuestion(userId);
      }

      // console.log(`API Response for ${userType}:`, data);

      if (data && data.response && data.response.questions) {
        setQuestions(data.response.questions);
        setIsLoading(false);
      } else {
        console.error("unexpected data structure:", data);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, userType]);

  const categorizedQuestions = useCategorizedQuestions(questions, userType);
  const schoolSurvey = categorizedQuestions.studentSurveys.schoolSurvey;
  const academicSurveys = categorizedQuestions.studentSurveys.academicSurveys;
  let filteredQuestions = useFilterQuestions(subject, teacher, academicSurveys);
  let sectionA = [];
  let sectionB = [];
  let sectionC = [];

  // Handling for student and parent user types
  if (userType === "student") {
    console.log("Filtered Questions for Academic Surveys:", filteredQuestions);
  } else if (userType === "parent") {
    const childQuestions = questions.filter(
      (question) =>
        question.student_id && question.student_id.toString() === child
    );

    sectionA = childQuestions.filter((question) =>
      question.section.startsWith("Section A")
    );
    sectionB = childQuestions.filter((question) =>
      question.section.startsWith("Section B")
    );
    sectionC = childQuestions.filter((question) =>
      question.section.startsWith("Section C")
    );

    filteredQuestions = [...sectionA, ...sectionB, ...sectionC];
  }

  // renders determined content based on type of user currently logged in
  let content;

  if (subject === "School" && userType === "student") {
    content = (
      <div>
        <h1>school survey</h1>
        <Questionnaire questions={schoolSurvey} />
      </div>
    );
  } else if (subject !== "School" && userType === "student") {
    content = <Questionnaire questions={filteredQuestions} />;
  } else if (userType === "parent") {
    content = (
      <div className="sm:py-64 pb-32 divide-y divide-gray-200">
        {sectionA.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold my-8 p-8 sm:p-0">Section A</h2>
            <Questionnaire questions={sectionA} />
          </div>
        )}
        {sectionB.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold my-8 p-8 sm:p-0">Section B</h2>
            <Questionnaire questions={sectionB} />
          </div>
        )}
        {sectionC.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold my-8 p-8 sm:p-0">Section C</h2>
            <Questionnaire questions={sectionC} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overscroll-x-hidden">
      <Navbar />
      {isLoading && <SpinnerBlack />}
      {!isLoading && <div className="h-full mt-48">{content}</div>}
    </div>
  );
};

export default SurveyPage;
