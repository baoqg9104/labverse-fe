import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";

type Lab = {
  id: number;
  title: string;
  slug: string;
};

type QuestionType = 0 | 1 | 2 | 3; // 0: SingleChoice, 1: MultipleChoice, 2: TrueFalse, 3: ShortText

export default function CreateQuestions() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>(0);
  const [choices, setChoices] = useState<string[]>([""]);
  const [correctText, setCorrectText] = useState("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [correctBool, setCorrectBool] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available labs on mount
  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/labs");
      setLabs(response.data);
      if (response.data.length > 0) {
        setSelectedLabId(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  const handleAddChoice = () => {
    setChoices([...choices, ""]);
  };

  const handleRemoveChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);
    // Remove from correct options if it was selected
    const removedChoice = choices[index];
    setCorrectOptions(correctOptions.filter((opt) => opt !== removedChoice));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleCorrectOptionToggle = (choice: string) => {
    if (questionType === 0) {
      // Single choice - single selection
      setCorrectOptions([choice]);
    } else if (questionType === 1) {
      // Multiple choice - multiple selection
      if (correctOptions.includes(choice)) {
        setCorrectOptions(correctOptions.filter((opt) => opt !== choice));
      } else {
        setCorrectOptions([...correctOptions, choice]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLabId) {
      toast.warn("Please select a lab");
      return;
    }

    if (!questionText.trim()) {
      toast.warn("Please enter question text");
      return;
    }

    // Validate based on question type
    if (questionType === 0 || questionType === 1) {
      const validChoices = choices.filter((c) => c.trim());
      if (validChoices.length < 2) {
        toast.warn("Please provide at least 2 choices");
        return;
      }
      if (correctOptions.length === 0) {
        toast.warn("Please select correct answer(s)");
        return;
      }
    }

    if (questionType === 3 && !correctText.trim()) {
      toast.warn("Please provide the correct answer");
      return;
    }

    setIsSubmitting(true);

    try {
      type BasePayload = {
        questionText: string;
        type: QuestionType;
        correctBool: boolean;
      };
      type ChoicePayload = BasePayload & {
        choices: string[];
        correctText: string;
        correctOptions: string[];
      };
      type TrueFalsePayload = BasePayload & {
        choices: string[];
        correctText: string;
        correctOptions: string[];
      };

      const base: BasePayload = {
        questionText,
        type: questionType,
        correctBool,
      };
      const payload: ChoicePayload | TrueFalsePayload = {
        ...base,
        choices: [],
        correctText: "",
        correctOptions: [],
      };

      // Add fields based on question type
      if (questionType === 0) {
        // Single choice
        payload.choices = choices.filter((c) => c.trim());
        payload.correctText = correctOptions[0] || "";
        payload.correctOptions = [];
      } else if (questionType === 1) {
        // Multiple choice
        payload.choices = choices.filter((c) => c.trim());
        payload.correctText = "";
        payload.correctOptions = correctOptions;
      } else if (questionType === 2) {
        // True/False
        payload.choices = [];
        payload.correctText = "";
        payload.correctOptions = [];
        // payload.correctBool already set in base as the true/false answer
      } else if (questionType === 3) {
        // Short text
        payload.correctText = correctText;
        payload.choices = [];
        payload.correctOptions = [];
      }

      await api.post(`/labs/${selectedLabId}/questions`, payload);

      toast.success("Question added successfully!");

      // Reset form
      setQuestionText("");
      setQuestionType(0);
      setChoices([""]);
      setCorrectText("");
      setCorrectOptions([]);
      setCorrectBool(true);
    } catch (error) {
      console.error("Failed to add question:", error);
      toast.error("Failed to add question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <span className="text-2xl">❓</span>
          Create Questions
        </h3>
        <p className="text-gray-600">
          Add questions to your labs to test learners' understanding
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Lab Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Lab *
          </label>
          <select
            value={selectedLabId || ""}
            onChange={(e) => setSelectedLabId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Choose a lab...
            </option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.title}
              </option>
            ))}
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Text *
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Type *
          </label>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={0}
                checked={questionType === 0}
                onChange={(e) =>
                  setQuestionType(Number(e.target.value) as QuestionType)
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Single Choice</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={1}
                checked={questionType === 1}
                onChange={(e) =>
                  setQuestionType(Number(e.target.value) as QuestionType)
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Multiple Choice</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={2}
                checked={questionType === 2}
                onChange={(e) =>
                  setQuestionType(Number(e.target.value) as QuestionType)
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>True/False</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={3}
                checked={questionType === 3}
                onChange={(e) =>
                  setQuestionType(Number(e.target.value) as QuestionType)
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Short Text</span>
            </label>
          </div>
        </div>

        {/* Choices for Single Choice and Multiple Choice */}
        {(questionType === 0 || questionType === 1) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Answer Choices *
            </label>
            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type={questionType === 0 ? "radio" : "checkbox"}
                    name="correct"
                    checked={correctOptions.includes(choice)}
                    onChange={() => handleCorrectOptionToggle(choice)}
                    disabled={!choice.trim()}
                    className="mt-3 text-blue-600 focus:ring-blue-500"
                    title={
                      questionType === 0
                        ? "Select correct answer"
                        : "Select correct answers"
                    }
                  />
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Choice ${index + 1}`}
                  />
                  {choices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddChoice}
              className="mt-3 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Choice
            </button>
            <p className="mt-2 text-sm text-gray-500">
              {questionType === 0
                ? "Select the radio button next to the correct answer"
                : "Check all correct answers"}
            </p>
          </div>
        )}

        {/* True/False Selection */}
        {questionType === 2 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correct Answer *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="trueFalse"
                  checked={correctBool === true}
                  onChange={() => setCorrectBool(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>True</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="trueFalse"
                  checked={correctBool === false}
                  onChange={() => setCorrectBool(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>False</span>
              </label>
            </div>
          </div>
        )}

        {/* Correct Answer for Short Text */}
        {questionType === 3 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correct Answer (for validation) *
            </label>
            <input
              type="text"
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the correct answer"
            />
            <p className="mt-2 text-sm text-gray-500">
              This will be used to validate the student's text answer
            </p>
          </div>
        )}

        {/* Correct Bool Flag - Only shown for non-TrueFalse types */}
        {questionType !== 2 && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={correctBool}
                onChange={(e) => setCorrectBool(e.target.checked)}
                className="text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Mark this question as graded
              </span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Uncheck if this is a practice question that shouldn't affect the
              score
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setQuestionText("");
                setQuestionType(0);
                setChoices([""]);
                setCorrectText("");
                setCorrectOptions([]);
                setCorrectBool(true);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Adding..." : "Add Question"}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Single Choice:</strong> Add choices and select one correct
            answer
          </li>
          <li>
            <strong>Multiple Choice:</strong> Add choices and select all correct
            answers
          </li>
          <li>
            <strong>True/False:</strong> Select whether the correct answer is
            True or False
          </li>
          <li>
            <strong>Short Text:</strong> Provide the correct answer for
            validation
          </li>
          <li>
            Questions marked as graded will contribute to the learner's score
          </li>
        </ul>
      </div>
    </div>
  );
}
