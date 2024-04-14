import { useEffect, useState } from "react";
import { i18n } from "@lingui/core";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { last } from "rambda";
import "katex/dist/katex.css";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import { PersonRaisedHand } from "react-bootstrap-icons";
import { ButtonWithTooltip } from "../ButtonWithTooltip";
import { CurrentQuizState } from "../../actors/CurrentQuizActor";
import { Id } from "@recapp/models";
import { MessageModal } from "../modals/MessageModal";

export const RunningQuizTab: React.FC<{
    quizState: CurrentQuizState;
    logQuestion: (questionId: Id, answer: string | boolean[]) => void;
}> = ({ quizState, logQuestion }) => {
    const [answered, setAnswered] = useState(false);
    const [rendered, setRendered] = useState<string>("");
    const [correct, setCorrect] = useState(false);
    const [textAnswer, setTextAnswer] = useState("");
    const [answers, setAnswers] = useState<boolean[]>([]);
    const { run, questions } = quizState;
    console.log(
        "QUES",
        quizState.questions.length,
        "RUN",
        quizState.run,
        "ENTRY",
        quizState.run?.counter,
        "FOO",
        quizState.questions[0]
    );

    const questionText = questions.at(run?.counter ?? 0)?.text;
    useEffect(() => {
        if (!questionText) {
            return;
        }
        const f = async () => {
            const result = await unified()
                .use(remarkParse)
                .use(remarkMath)
                .use(remarkRehype)
                .use(rehypeKatex)
                .use(rehypeStringify)
                .process(questionText);
            setRendered(result.toString());
        };
        f();
    }, [questionText]);

    useEffect(() => {
        setCorrect(last(quizState.run?.correct ?? []) ?? false);
    }, [quizState.run?.correct.length]);

    if (!quizState.run || !quizState.questions) {
        return null;
    }

    const logQuestionClicked = () => {
        logQuestion(
            questions[run?.counter ?? 0].uid,
            questions[run?.counter ?? 0].type === "TEXT" ? textAnswer : answers
        );
        setAnswered(true);
    };

    const nextQuestion = () => {
        setAnswered(false);
        setTextAnswer("");
        setAnswers([]);
    };

    const updateAnswer = (index: number, value: boolean) => {
        const answersCopy = questions[run?.counter ?? 0].type === "SINGLE" ? answers.map(() => false) : [...answers];
        if (answersCopy.length === 0) {
            const a = new Array(questions[run?.counter ?? 0].answers.length).map(() => false);
            a[index] = value;
            console.log("ANSWERS NEW", a);
            setAnswers(a);
        } else {
            const a = answersCopy;
            a[index] = value;
            console.log("ANSWERS", a);
            setAnswers(a);
        }
    };
    const currentQuestion = questions[run?.counter ?? 0];
    const questionType = questions[run?.counter ?? 0]?.type;

    return (
        <Row>
            <MessageModal
                show={answered}
                color={correct ? "green" : "red"}
                titleId={correct ? "answer-correct-title" : "answer-wrong-title"}
                textId={correct ? "answer-correct" : "answer-wrong"}
                onClose={nextQuestion}
            />
            {(run?.counter ?? 0) < questions.length && (
                <Card className="p-0">
                    <Card.Header className="text-start d-flex flex-row">
                        <div className="align-self-center">
                            <strong>Frage {(run?.counter ?? 0) + 1}</strong>
                        </div>

                        <div className="flex-grow-1"></div>
                        <div className="m-1">
                            <ButtonWithTooltip
                                title={i18n._("running-quiz-tab.button-tooltip.comment")}
                                variant="secondary"
                            >
                                <PersonRaisedHand />
                            </ButtonWithTooltip>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="p-2 text-start h-30" dangerouslySetInnerHTML={{ __html: rendered }} />
                    </Card.Body>
                    <Card.Footer>
                        {questionType !== "TEXT" && (
                            <Form className="text-start mb-2">
                                {currentQuestion.answers.map((answer, index) => {
                                    return (
                                        <Form.Check
                                            key={answer.text}
                                            label={answer.text}
                                            name="answer"
                                            type={currentQuestion.type === "SINGLE" ? "radio" : "checkbox"}
                                            onChange={event => updateAnswer(index, event.target.checked)}
                                        />
                                    );
                                })}
                            </Form>
                        )}
                        {questionType === "TEXT" && (
                            <div className="d-flex flex-column flex-grow-1">
                                <div data-color-mode="light">
                                    <MDEditor
                                        commands={[
                                            commands.bold,
                                            commands.italic,
                                            commands.strikethrough,
                                            commands.divider,
                                            commands.link,
                                            commands.quote,
                                            commands.code,
                                            commands.divider,
                                            commands.unorderedListCommand,
                                            commands.orderedListCommand,
                                            commands.checkedListCommand,
                                            commands.divider,
                                            commands.help,
                                        ]}
                                        extraCommands={[]}
                                        value={textAnswer}
                                        onChange={val => val && setTextAnswer(val)}
                                        height="100%"
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        components={{ preview: (_source, _state, _dispath) => <></> }}
                                        preview="edit"
                                    />
                                </div>
                            </div>
                        )}
                        <Button onClick={logQuestionClicked}>Abschließen</Button>
                    </Card.Footer>
                </Card>
            )}
            {(run?.counter ?? 0) === questions.length && (
                <Card className="p-0">
                    <Card.Header className="text-start d-flex flex-row">
                        <div className="align-self-center">
                            <strong>Quiz abgeschlossen</strong>
                        </div>
                        <div className="flex-grow-1"></div>
                    </Card.Header>
                    <Card.Body>
                        <div className="p-2 text-start h-30">
                            {questions.length} Fragen beantwortet. Davon {run?.correct.filter(Boolean).length ?? 0}{" "}
                            richtige Antworten.
                        </div>
                        `
                    </Card.Body>
                    <Card.Footer>&nbsp;</Card.Footer>
                </Card>
            )}
        </Row>
    );
};
