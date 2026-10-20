import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  it("renders the Insert Sample Documents button", () => {
    render(<SearchBar onSearch={() => {}} onIngest={() => {}} loading={false} />);
    expect(screen.getByText("Insert Sample Documents")).toBeInTheDocument();
  });

  it("renders the Search button", () => {
    render(<SearchBar onSearch={() => {}} onIngest={() => {}} loading={false} />);
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("renders a textarea with default query text", () => {
    render(<SearchBar onSearch={() => {}} onIngest={() => {}} loading={false} />);
    const textarea = screen.getByPlaceholderText("Ask your query...");
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).not.toBe("");
  });

  it("calls onSearch with the current query when Search is clicked", () => {
    const mockSearch = vi.fn();
    render(<SearchBar onSearch={mockSearch} onIngest={() => {}} loading={false} />);
    fireEvent.click(screen.getByText("Search"));
    expect(mockSearch).toHaveBeenCalledOnce();
    expect(typeof mockSearch.mock.calls[0][0]).toBe("string");
  });

  it("calls onIngest with sample documents when Insert button is clicked", () => {
    const mockIngest = vi.fn();
    render(<SearchBar onSearch={() => {}} onIngest={mockIngest} loading={false} />);
    fireEvent.click(screen.getByText("Insert Sample Documents"));
    expect(mockIngest).toHaveBeenCalledOnce();
    const docs = mockIngest.mock.calls[0][0];
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThan(0);
  });

  it("disables both buttons when loading is true", () => {
    render(<SearchBar onSearch={() => {}} onIngest={() => {}} loading={true} />);
    expect(screen.getByText("Search")).toBeDisabled();
    expect(screen.getByText("Insert Sample Documents")).toBeDisabled();
  });

  it("updates the query value when the user types in the textarea", () => {
    render(<SearchBar onSearch={() => {}} onIngest={() => {}} loading={false} />);
    const textarea = screen.getByPlaceholderText("Ask your query...");
    fireEvent.change(textarea, { target: { value: "new query text" } });
    expect(textarea.value).toBe("new query text");
  });
});
