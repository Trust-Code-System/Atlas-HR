"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSurvey } from "../actions";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

type Question = { text: string; type: "text" | "rating" | "nps" };
const SURVEY_TYPE_OPTIONS = [
  { value: "pulse", label: "Pulse — short recurring check-in" },
  { value: "enps", label: "eNPS — employee net promoter score" },
  { value: "custom", label: "Custom — build your own" },
];
const QUESTION_TYPE_OPTIONS = [
  { value: "text", label: "Open text" },
  { value: "rating", label: "Rating (1–5 stars)" },
  { value: "nps", label: "NPS (0–10 scale)" },
];

const defaultPulseQuestions: Question[] = [
  { text: "How would you rate your overall job satisfaction this week?", type: "rating" },
  { text: "Do you feel recognised for your contributions?", type: "rating" },
  { text: "Any comments or suggestions for the team?", type: "text" },
];

export function NewSurveyForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createSurvey, null);
  const [surveyType, setSurveyType] = useState<"enps" | "pulse" | "custom">("pulse");
  const [questions, setQuestions] = useState<Question[]>(defaultPulseQuestions);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/surveys/${state.id}`);
  }, [state, router]);

  function handleSurveyTypeChange(value: string) {
    const next = value as "enps" | "pulse" | "custom";
    setSurveyType(next);
    if (next === "pulse") setQuestions(defaultPulseQuestions);
    else if (next === "custom") setQuestions([{ text: "", type: "text" }]);
  }


  function addQuestion() {
    setQuestions((q) => [...q, { text: "", type: "text" }]);
  }

  function removeQuestion(i: number) {
    setQuestions((q) => q.filter((_, idx) => idx !== i));
  }

  function updateQuestion(i: number, field: keyof Question, value: string) {
    setQuestions((q) =>
      q.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  }

  const showQuestionBuilder = surveyType !== "enps";

  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-6">
      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        )}

        <div>
          <label className={labelCls}>Survey title <span className="text-red-500">*</span></label>
          <Input name="title" placeholder="e.g. Q2 Employee Pulse" required />
        </div>

        <div>
          <label className={labelCls}>Survey type</label>
          <Select
            name="type"
            value={surveyType}
            onChange={handleSurveyTypeChange}
            options={SURVEY_TYPE_OPTIONS}
          />
        </div>

        <div>
          <label className={labelCls}>Closes on (optional)</label>
          <DatePicker name="ends_at" placeholder="Pick a closing date" />
        </div>

        {/* eNPS preview */}
        {surveyType === "enps" && (
          <div className="bg-navy-50 border border-navy-200 rounded-xl px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Auto-generated questions</p>
            <p className="text-sm text-navy-700">1. On a scale of 0–10, how likely are you to recommend this company as a place to work?</p>
            <p className="text-sm text-navy-700">2. What&apos;s the main reason for your score?</p>
          </div>
        )}

        {/* Question builder */}
        {showQuestionBuilder && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={labelCls + " mb-0"}>Questions <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={addQuestion}
                className="text-xs font-semibold text-blue-700 hover:text-green-800 flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add question
              </button>
            </div>

            {questions.map((q, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input
                    name="question_text"
                    value={q.text}
                    onChange={(e) => updateQuestion(i, "text", e.target.value)}
                    placeholder={`Question ${i + 1}…`}
                    className="flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <Select
                    name="question_type"
                    value={q.type}
                    onChange={(value) => updateQuestion(i, "type", value)}
                    triggerClassName="h-9 py-1.5 text-xs text-navy-700"
                    options={QUESTION_TYPE_OPTIONS}
                  />
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="mt-2 p-1.5 text-navy-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/surveys"
            className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>
            Create survey
          </Button>
        </div>
      </form>
    </div>
  );
}
