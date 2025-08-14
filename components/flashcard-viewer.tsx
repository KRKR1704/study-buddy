"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FlashcardViewerProps {
  onBack: () => void
  onViewQuiz: () => void
  onBackToDashboard: () => void
}

interface Flashcard {
  id: number
  front: string
  back: string
  category: string
  difficulty: "easy" | "medium" | "hard"
}

export function FlashcardViewer({ onBack, onViewQuiz, onBackToDashboard }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  // Sample flashcards based on the ML document
  const flashcards: Flashcard[] = [
    {
      id: 1,
      front: "What is Machine Learning?",
      back: "Machine Learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience, without being explicitly programmed.",
      category: "Definition",
      difficulty: "easy",
    },
    {
      id: 2,
      front: "What are the three main types of Machine Learning?",
      back: "1. Supervised Learning - Learning with labeled training data\n2. Unsupervised Learning - Finding hidden patterns without labeled examples\n3. Reinforcement Learning - Learning through interaction with environment",
      category: "Types",
      difficulty: "medium",
    },
    {
      id: 3,
      front: "What is the difference between overfitting and underfitting?",
      back: "Overfitting occurs when a model learns the training data too well, including noise, leading to poor generalization. Underfitting occurs when a model is too simple to capture the underlying patterns in the data.",
      category: "Concepts",
      difficulty: "hard",
    },
    {
      id: 4,
      front: "What are Neural Networks?",
      back: "Neural Networks are computing systems inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information through weighted connections and activation functions.",
      category: "Architecture",
      difficulty: "medium",
    },
    {
      id: 5,
      front: "What is Deep Learning?",
      back: "Deep Learning is a subset of machine learning using neural networks with multiple layers (deep networks) to model and understand complex patterns in data.",
      category: "Advanced",
      difficulty: "hard",
    },
    {
      id: 6,
      front: "Why is data quality important in Machine Learning?",
      back: "Data quality is crucial because machine learning models learn from data. Poor quality data leads to poor model performance. High-quality, relevant, and representative data is essential for building effective ML systems.",
      category: "Data",
      difficulty: "easy",
    },
    {
      id: 7,
      front: "What is the bias-variance tradeoff?",
      back: "The bias-variance tradeoff is the balance between a model's ability to minimize bias (error from oversimplifying) and variance (error from sensitivity to small fluctuations). Finding the right balance is key to good model performance.",
      category: "Concepts",
      difficulty: "hard",
    },
    {
      id: 8,
      front: "What is feature selection?",
      back: "Feature selection is the process of selecting the most relevant and important features (input variables) for building machine learning models, which helps improve performance and reduce complexity.",
      category: "Preprocessing",
      difficulty: "medium",
    },
  ]

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    setIsFlipped(false)
    setShowAnswer(false)
  }

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setIsFlipped(false)
    setShowAnswer(false)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    setShowAnswer(!showAnswer)
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevCard()
      if (e.key === "ArrowRight") nextCard()
      if (e.key === " ") {
        e.preventDefault()
        flipCard()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Summary
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Flash Cards</h2>
              <p className="text-gray-600">
                Card {currentIndex + 1} of {flashcards.length} • Machine Learning Concepts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onViewQuiz}>
              <FileText className="h-4 w-4 mr-2" />
              Take Quiz
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getDifficultyColor(flashcards[currentIndex].difficulty)}>
                {flashcards[currentIndex].difficulty.toUpperCase()}
              </Badge>
              <Badge variant="outline">{flashcards[currentIndex].category}</Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard Carousel */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Previous Cards (Left) */}
          <div className="absolute left-0 flex items-center space-x-4 opacity-30 transform scale-75 -translate-x-8">
            {[-2, -1].map((offset) => {
              const index = (currentIndex + offset + flashcards.length) % flashcards.length
              return (
                <Card
                  key={`prev-${index}`}
                  className="w-64 h-80 bg-white shadow-lg transform rotate-12 cursor-pointer hover:scale-105 transition-all duration-300"
                  onClick={prevCard}
                >
                  <CardContent className="p-6 h-full flex items-center justify-center">
                    <p className="text-sm text-gray-600 text-center line-clamp-6">{flashcards[index].front}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Current Card (Center) */}
          <div className="relative z-10">
            <Card
              className={`w-96 h-96 bg-white shadow-2xl cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                isFlipped ? "rotate-y-180" : ""
              }`}
              onClick={flipCard}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front of Card */}
              <CardContent
                className="p-8 h-full flex flex-col justify-center items-center text-center absolute inset-0 backface-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="mb-4">
                  <Badge className="bg-blue-100 text-blue-800 mb-4">Question</Badge>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                  {flashcards[currentIndex].front}
                </h3>
                <div className="mt-auto">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4" />
                    Click to reveal answer
                  </p>
                </div>
              </CardContent>

              {/* Back of Card */}
              <CardContent
                className="p-8 h-full flex flex-col justify-center items-center text-center absolute inset-0 bg-blue-50"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="mb-4">
                  <Badge className="bg-green-100 text-green-800 mb-4">Answer</Badge>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{flashcards[currentIndex].back}</p>
                </div>
                <div className="mt-auto">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Click to hide answer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Cards (Right) */}
          <div className="absolute right-0 flex items-center space-x-4 opacity-30 transform scale-75 translate-x-8">
            {[1, 2].map((offset) => {
              const index = (currentIndex + offset) % flashcards.length
              return (
                <Card
                  key={`next-${index}`}
                  className="w-64 h-80 bg-white shadow-lg transform -rotate-12 cursor-pointer hover:scale-105 transition-all duration-300"
                  onClick={nextCard}
                >
                  <CardContent className="p-6 h-full flex items-center justify-center">
                    <p className="text-sm text-gray-600 text-center line-clamp-6">{flashcards[index].front}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-6">
          <Button variant="outline" size="lg" onClick={prevCard} className="flex items-center gap-2 hover:bg-blue-50">
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>

          <Button variant="outline" size="lg" onClick={flipCard} className="flex items-center gap-2 hover:bg-green-50">
            <RotateCcw className="h-5 w-5" />
            {isFlipped ? "Hide Answer" : "Show Answer"}
          </Button>

          <Button variant="outline" size="lg" onClick={nextCard} className="flex items-center gap-2 hover:bg-blue-50">
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Card Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsFlipped(false)
                setShowAnswer(false)
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Use <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd> and{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd> to navigate,{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to flip cards
          </p>

          {/* Back to Dashboard Button */}
          <Button variant="outline" onClick={onBackToDashboard} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
