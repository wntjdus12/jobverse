export default function Question({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}) {
  return (
    <div className="question-container">
      <p className="question-counter">
        {questionNumber} / {totalQuestions}
      </p>
      <h2 className="question-title">{question.title}</h2>

      <div className="choices-list">
        {question.choices.map((choice) => (
          <button
            key={choice.key}
            className="choice-button"
            onClick={() => onAnswer(question.id, choice.key)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
