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

export default function ViewQuestions() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        return "Multiple Choice";
      case 1:
        return "Text Input";
      case 2:
        return "Checkbox";
      default:
        return "Unknown";
    }
  };

  const getQuestionTypeIcon = (type: number) => {
    switch (type) {
      case 0:
        return "⭕";
      case 1:
        return "✏️";
      case 2:
        return "☑️";
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
      await api.delete(`/api/labs/${selectedLabId}/questions/${questionId}`);
      alert("Question deleted successfully!");
      if (selectedLabId) {
        fetchQuestions(selectedLabId);
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete question. Please try again.");
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
              Multiple Choice
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 1).length}
              </strong>{" "}
              Text Input
              {" • "}
              <strong>
                {questions.filter((q) => q.type === 2).length}
              </strong>{" "}
              Checkbox
            </>
          )}
        </div>
      </div>
    </div>
  );
}