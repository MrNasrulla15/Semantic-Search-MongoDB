import { render, screen } from "@testing-library/react";
import Results from "../Results";

const SAMPLE_ITEMS = [
  { id: "1", title: "MongoDB Aggregation", content: "Aggregation pipelines transform data.", score: 0.9512 },
  { id: "2", title: "Text Embeddings", content: "Embeddings convert text to vectors.", score: 0.8234 }
];

describe("Results", () => {
  it("shows 'No results yet.' when items is empty", () => {
    render(<Results items={[]} />);
    expect(screen.getByText("No results yet.")).toBeInTheDocument();
  });

  it("renders a list item for each result", () => {
    render(<Results items={SAMPLE_ITEMS} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
  });

  it("displays the title of each result", () => {
    render(<Results items={SAMPLE_ITEMS} />);
    expect(screen.getByText("MongoDB Aggregation")).toBeInTheDocument();
    expect(screen.getByText("Text Embeddings")).toBeInTheDocument();
  });

  it("displays the content of each result", () => {
    render(<Results items={SAMPLE_ITEMS} />);
    expect(screen.getByText("Aggregation pipelines transform data.")).toBeInTheDocument();
  });

  it("displays the score formatted to 4 decimal places", () => {
    render(<Results items={SAMPLE_ITEMS} />);
    expect(screen.getByText("Score: 0.9512")).toBeInTheDocument();
    expect(screen.getByText("Score: 0.8234")).toBeInTheDocument();
  });

  it("shows 'Untitled' for a result with no title", () => {
    render(<Results items={[{ id: "3", title: "", content: "No title here.", score: 0.5 }]} />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });
});
