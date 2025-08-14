"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface QuizViewerProps {
  onComplete: () => void
  entryPoint: "summary" | "flashcards" | "quiz-section"
}

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  category: string
}

interface QuizResult {
  questionId: number
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number
}

export function QuizViewer({ onComplete, entryPoint }: QuizViewerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  const [isQuizComplete, setIsQuizComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds

  // Sample quiz questions based on ML document
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What is Machine Learning primarily focused on?",
      options: [
        "Programming computers with explicit instructions",
        "Developing algorithms that improve through experience",
        "Creating user interfaces for applications",
        "Managing databases efficiently",
      ],
      correctAnswer: 1,
      explanation:
        "Machine Learning focuses on developing algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience, without being explicitly programmed.",
      difficulty: "easy",
      category: "Definition",
    },
    {
      id: 2,
      question: "Which of the following is NOT one of the three main types of Machine Learning?",
      options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Structured Learning"],
      correctAnswer: 3,
      explanation:
        "The three main types of Machine Learning are Supervised Learning (with labeled data), Unsupervised Learning (finding patterns without labels), and Reinforcement Learning (learning through interaction). Structured Learning is not a standard ML category.",
      difficulty: "medium",
      category: "Types",
    },
    {
      id: 3,
      question: "What happens when a machine learning model suffers from overfitting?",
      options: [
        "It performs well on both training and test data",
        "It learns the training data too well, including noise, leading to poor generalization",
        "It is too simple to capture underlying patterns",
        "It requires more training data to improve",
      ],
      correctAnswer: 1,
      explanation:
        "Overfitting occurs when a model learns the training data too well, including noise and random fluctuations, which leads to poor performance on new, unseen data. The model fails to generalize properly.",
      difficulty: "hard",
      category: "Concepts",
    },
    {
      id: 4,
      question: "Neural Networks are inspired by which biological system?",
      options: [
        "The human digestive system",
        "The circulatory system",
        "Biological neural networks (brain neurons)",
        "The respiratory system",
      ],
      correctAnswer: 2,
      explanation:
        "Neural Networks are computing systems inspired by biological neural networks, specifically the way neurons in the brain are interconnected and process information through weighted connections.",
      difficulty: "easy",
      category: "Architecture",
    },
    {
      id: 5,
      question: "What distinguishes Deep Learning from traditional Machine Learning?",
      options: [
        "Deep Learning uses smaller datasets",
        "Deep Learning uses neural networks with multiple layers",
        "Deep Learning is faster to train",
        "Deep Learning doesn't require any data preprocessing",
      ],
      correctAnswer: 1,
      explanation:
        "Deep Learning is a subset of machine learning that uses neural networks with multiple layers (deep networks) to model and understand complex patterns in data. The 'deep' refers to the multiple layers in the network.",
      difficulty: "medium",
      category: "Advanced",
    },
    {
      id: 6,
      question: "Why is data quality crucial in Machine Learning?",
      options: [
        "It makes the algorithms run faster",
        "It reduces the cost of computation",
        "Machine learning models learn from data, so poor quality data leads to poor model performance",
        "It makes the code easier to write",
      ],
      correctAnswer: 2,
      explanation:
        "Data quality is crucial because machine learning models learn patterns from the data they're trained on. If the data is poor quality, incomplete, or biased, the model will learn these flaws and perform poorly on real-world tasks.",
      difficulty: "easy",
      category: "Data",
    },
    {
      id: 7,
      question: "What is the bias-variance tradeoff in Machine Learning?",
      options: [
        "The balance between model complexity and training time",
        "The balance between accuracy and speed",
        "The balance between minimizing bias (oversimplifying) and variance (sensitivity to fluctuations)",
        "The balance between supervised and unsupervised learning",
      ],
      correctAnswer: 2,
      explanation:
        "The bias-variance tradeoff is the balance between a model's ability to minimize bias (error from oversimplifying the problem) and variance (error from sensitivity to small fluctuations in the training data). Finding the right balance is key to good model performance.",
      difficulty: "hard",
      category: "Concepts",
    },
    {
      id: 8,
      question: "What is the purpose of feature selection in Machine Learning?",
      options: [
        "To make the dataset larger",
        "To select the most relevant input variables for building models",
        "To increase the complexity of the model",
        "To slow down the training process",
      ],
      correctAnswer: 1,
      explanation:
        "Feature selection is the process of selecting the most relevant and important features (input variables) for building machine learning models. This helps improve performance, reduce complexity, and avoid overfitting.",
      difficulty: "medium",
      category: "Preprocessing",
    },
    {
      id: 9,
      question: "In supervised learning, what is required in the training data?",
      options: [
        "Only input features",
        "Only output labels",
        "Both input features and corresponding output labels",
        "Neither inputs nor outputs",
      ],
      correctAnswer: 2,
      explanation:
        "Supervised learning requires training data that includes both input features and their corresponding output labels (target values). The algorithm learns to map inputs to outputs based on these labeled examples.",
      difficulty: "easy",
      category: "Types",
    },
    {
      id: 10,
      question: "What is the main goal of unsupervised learning?",
      options: [
        "To predict specific output values",
        "To find hidden patterns in data without labeled examples",
        "To classify data into predefined categories",
        "To optimize a reward function",
      ],
      correctAnswer: 1,
      explanation:
        "Unsupervised learning aims to find hidden patterns, structures, or relationships in data without having labeled examples. Common techniques include clustering (grouping similar data) and dimensionality reduction.",
      difficulty: "medium",
      category: "Types",
    },
  ]

  // Timer effect
  useEffect(() => {
    if (!isQuizComplete && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isQuizComplete) {
      handleQuizComplete()
    }
  }, [timeLeft, isQuizComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const question = questions[currentQuestion]
    const isCorrect = selectedAnswer === question.correctAnswer
    const timeSpent = Date.now() - startTime

    const result: QuizResult = {
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
    }

    setQuizResults([...quizResults, result])
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      handleQuizComplete()
    }
  }

  const handleQuizComplete = () => {
    setIsQuizComplete(true)
  }

  const calculateScore = () => {
    const correct = quizResults.filter((r) => r.isCorrect).length
    return Math.round((correct / questions.length) * 100)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! Outstanding performance!"
    if (score >= 80) return "Great job! You have a solid understanding!"
    if (score >= 70) return "Good work! Keep studying to improve!"
    if (score >= 60) return "Not bad! Review the material and try again!"
    return "Keep studying! Practice makes perfect!"
  }

  if (isQuizComplete) {
    const score = calculateScore()
    const totalTime = quizResults.reduce((sum, r) => sum + r.timeSpent, 0)
    const avgTimePerQuestion = totalTime / questions.length / 1000

    return (
      <div className="flex-1 p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-4">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600">Here's how you performed</p>
            </div>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</p>
                <p className="text-sm text-gray-600">Final Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {quizResults.filter((r) => r.isCorrect).length}/{questions.length}
                </p>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-3xl font-bold text-gray-900">{avgTimePerQuestion.toFixed(1)}s</p>
                <p className="text-sm text-gray-600">Avg. per Question</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Message */}
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <h3 className={`text-xl font-semibold mb-2 ${getScoreColor(score)}`}>{getScoreMessage(score)}</h3>
              <p className="text-gray-600">
                You answered {quizResults.filter((r) => r.isCorrect).length} out of {questions.length} questions
                correctly.
              </p>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.map((question, index) => {
                  const result = quizResults[index]
                  const isCorrect = result?.isCorrect

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border-l-4 ${isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Q{index + 1}: {question.question}
                        </h4>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Your answer:</span>
                          <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                            {question.options[result?.selectedAnswer || 0]}
                          </span>
                        </div>

                        {!isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Correct answer:</span>
                            <span className="text-green-700">{question.options[question.correctAnswer]}</span>
                          </div>
                        )}

                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <span className="font-medium text-blue-900">Explanation: </span>
                          <span className="text-blue-800">{question.explanation}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={onComplete} size="lg" className="bg-blue-600 hover:bg-blue-700">
              {entryPoint === "quiz-section" ? "Back to Dashboard" : "Back to Summary"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Machine Learning Quiz</h2>
            <p className="text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 60 ? "text-red-600 font-bold" : ""}>{formatTime(timeLeft)}</span>
            </div>
            <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty.toUpperCase()}</Badge>
            <Badge variant="outline">{question.category}</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? showResult
                        ? index === question.correctAnswer
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-red-500 bg-red-50 text-red-800"
                        : "border-blue-500 bg-blue-50"
                      : showResult && index === question.correctAnswer
                        ? "border-green-500 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                        selectedAnswer === index
                          ? showResult
                            ? index === question.correctAnswer
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-red-500 bg-red-500 text-white"
                            : "border-blue-500 bg-blue-500 text-white"
                          : showResult && index === question.correctAnswer
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showResult && selectedAnswer === index && index !== question.correctAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {showResult && index === question.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Explanation (shown after answer) */}
        {showResult && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          {!showResult ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} size="lg" className="bg-green-600 hover:bg-green-700">
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "View Results"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
