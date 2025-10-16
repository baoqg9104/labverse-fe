import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";

type Lab = {
  id: number;
  title: string;
  slug: string;
};

type Question = {
  id: number;
  labId: number;
  questionText: string;
  type: number;
  choicesJson: string;
};

type QuestionType = 0 | 1 | 2 | 3; // 0: SingleChoice, 1: MultipleChoice, 2: TrueFalse, 3: ShortText

export default function ViewQuestions() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>(0);
  const [choices, setChoices] = useState<string[]>([""]);
  const [correctText, setCorrectText] = useState("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [correctBool, setCorrectBool] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/labs");
      setLabs(response.data);
      if (response.data.length > 0) {
        setSelectedLabId(response.data[0].id);
        fetchQuestions(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  const fetchQuestions = async (labId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/labs/${labId}/questions`);
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabChange = (labId: number) => {
    setSelectedLabId(labId);
    fetchQuestions(labId);
  };

  const getQuestionTypeLabel = (type: number) => {
    switch (type) {
      case 0:
        return "Single Choice";
      case 1:
        return "Multiple Choice";
      case 2:
        return "True/False";
      case 3:
        return "Short Text";
      default:
        return "Unknown";
    }
  };

  const getQuestionTypeIcon = (type: number) => {
    switch (type) {
      case 0:
        return "⭕";
      case 1:
        return "☑️";
      case 2:
        return "✓✗";
      case 3:
        return "✏️";
      default:
        return "❓";
    }
  };

  const parseChoices = (choicesJson: string): string[] => {
    try {
      return JSON.parse(choicesJson);
    } catch {
      return [];
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await api.delete(`/labs/${selectedLabId}/questions/${questionId}`);
      alert("Question deleted successfully!");
      if (selectedLabId) {
        fetchQuestions(selectedLabId);
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete question. Please try again.");
    }
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setQuestionType(question.type as QuestionType);
    
    const parsedChoices = parseChoices(question.choicesJson);
    if (parsedChoices.length > 0) {
      setChoices(parsedChoices);
    } else {
      setChoices([""]);
    }
    
    setCorrectText("");
    setCorrectOptions([]);
    setCorrectBool(true);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType(0);
    setChoices([""]);
    setCorrectText("");
    setCorrectOptions([]);
    setCorrectBool(true);
  };

  const handleAddChoice = () => {
    setChoices([...choices, ""]);
  };

  const handleRemoveChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);
    const removedChoice = choices[index];
    setCorrectOptions(correctOptions.filter(opt => opt !== removedChoice));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleCorrectOptionToggle = (choice: string) => {
    if (questionType === 0) {
      setCorrectOptions([choice]);
    } else if (questionType === 1) {
      if (correctOptions.includes(choice)) {
        setCorrectOptions(correctOptions.filter(opt => opt !== choice));
      } else {
        setCorrectOptions([...correctOptions, choice]);
      }
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedLabId || !editingQuestion) {
      alert("Invalid question or lab");
      return;
    }

    if (!questionText.trim()) {
      alert("Please enter question text");
      return;
    }

    if (questionType === 0 || questionType === 1) {
      const validChoices = choices.filter(c => c.trim());
      if (validChoices.length < 2) {
        alert("Please provide at least 2 choices");
        return;
      }
      if (correctOptions.length === 0) {
        alert("Please select correct answer(s)");
        return;
      }
    }

    if (questionType === 3 && !correctText.trim()) {
      alert("Please provide the correct answer");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        questionText,
        type: questionType,
        correctBool,
      };

      if (questionType === 0) {
        // Single choice
        payload.choices = choices.filter(c => c.trim());
        payload.correctText = correctOptions[0] || "";
        payload.correctOptions = [];
      } else if (questionType === 1) {
        // Multiple choice
        payload.choices = choices.filter(c => c.trim());
        payload.correctText = "";
        payload.correctOptions = correctOptions;
      } else if (questionType === 2) {
        // True/False
        payload.choices = [];
        payload.correctText = "";
        payload.correctOptions = [];
        payload.correctBool = correctBool;
      } else if (questionType === 3) {
        // Short text
        payload.correctText = correctText;
        payload.choices = [];
        payload.correctOptions = [];
      }

      console.log("Update payload:", payload);

      await api.patch(`/labs/${selectedLabId}/questions/${editingQuestion.id}`, payload);
      
      alert("Question updated successfully!");
      handleCloseModal();
      fetchQuestions(selectedLabId);
    } catch (error) {
      console.error("Failed to update question:", error);
      alert("Failed to update question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <span className="text-2xl">📋</span>
          View Questions
        </h3>
        <p className="text-gray-600">
          Browse and manage questions for each lab
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Lab
        </label>
        <select
          value={selectedLabId || ""}
          onChange={(e) => handleLabChange(Number(e.target.value))}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading questions...</div>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            No questions yet
          </h4>
          <p className="text-gray-600">
            This lab doesn't have any questions. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const choices = parseChoices(question.choicesJson);
            return (
              <div
                key={question.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">
                      {getQuestionTypeIcon(question.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          Question {index + 1}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {getQuestionTypeLabel(question.type)}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium text-lg">
                        {question.questionText}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(question)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {choices.length > 0 && (
                  <div className="mt-4 pl-11">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Answer Choices:
                    </div>
                    <div className="space-y-2">
                      {choices.map((choice, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-gray-700"
                        >
                          <span className="text-gray-400">
                            {question.type === 0 ? "○" : "☐"}
                          </span>
                          <span>{choice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Quick Stats:</h4>
        <div className="text-sm text-blue-800">
          <strong>{questions.length}</strong> question(s) in this lab
          {questions.length > 0 && (
            <>
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 0).length}
              </strong>{" "}
              Single Choice
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 1).length}
              </strong>{" "}
              Multiple Choice
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 2).length}
              </strong>{" "}
              True/False
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 3).length}
              </strong>{" "}
              Short Text
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Question</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
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
                      onChange={(e) => setQuestionType(Number(e.target.value) as QuestionType)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Single Choice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={1}
                      checked={questionType === 1}
                      onChange={(e) => setQuestionType(Number(e.target.value) as QuestionType)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Multiple Choice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={2}
                      checked={questionType === 2}
                      onChange={(e) => setQuestionType(Number(e.target.value) as QuestionType)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>True/False</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={3}
                      checked={questionType === 3}
                      onChange={(e) => setQuestionType(Number(e.target.value) as QuestionType)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Short Text</span>
                  </label>
                </div>
              </div>

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
                </div>
              )}

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
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuestion}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}