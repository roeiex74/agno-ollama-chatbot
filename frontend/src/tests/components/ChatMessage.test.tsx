import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatMessage } from "../../components/ChatMessage";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe("ChatMessage", () => {
  it("renders user message correctly", () => {
    render(<ChatMessage role="user" content="Hello, world!" />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("renders assistant message correctly", () => {
    render(<ChatMessage role="assistant" content="Hi there!" />);
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows 'Thinking...' when streaming with no content", () => {
    render(<ChatMessage role="assistant" content="" isStreaming={true} />);
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("shows copy button for assistant messages (not streaming)", () => {
    render(<ChatMessage role="assistant" content="Test message" />);
    const copyButton = screen.getByRole("button");
    expect(copyButton).toBeInTheDocument();
  });

  it("does not show copy button for user messages", () => {
    render(<ChatMessage role="user" content="Test message" />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("does not show copy button when streaming", () => {
    render(
      <ChatMessage
        role="assistant"
        content="Test message"
        isStreaming={true}
      />
    );
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("copies message to clipboard when copy button is clicked", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");

    render(<ChatMessage role="assistant" content="Copy this text" />);

    const copyButton = screen.getByRole("button");
    await user.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith("Copy this text");
  });

  it("renders multi-line content correctly", () => {
    const multilineContent = "Line 1\nLine 2\nLine 3";
    const { container } = render(<ChatMessage role="assistant" content={multilineContent} />);

    // Check if all lines are present in the rendered content
    expect(container.textContent).toContain("Line 1");
    expect(container.textContent).toContain("Line 2");
    expect(container.textContent).toContain("Line 3");
  });
});
