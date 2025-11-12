/**
 * Comprehensive tests for ChatMessage component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('ChatMessage Component', () => {
  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  describe('Rendering', () => {
    it('renders user message correctly', () => {
      render(
        <ChatMessage
          role="user"
          content="Hello, how are you?"
        />
      );

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('renders assistant message correctly', () => {
      render(
        <ChatMessage
          role="assistant"
          content="I am doing well, thank you!"
        />
      );

      expect(screen.getByText(/I am doing well, thank you!/)).toBeInTheDocument();
    });

    it('renders with timestamp', () => {
      const timestamp = new Date('2025-01-10T12:00:00');
      render(
        <ChatMessage
          role="user"
          content="Test message"
          timestamp={timestamp}
        />
      );

      // Message should be rendered
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with message ID', () => {
      const { container } = render(
        <ChatMessage
          role="assistant"
          content="Test message"
          messageId="msg-123"
        />
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });

    it('renders empty content', () => {
      render(
        <ChatMessage
          role="user"
          content=""
        />
      );

      // Should render without crashing
      const message = screen.queryByText(/./);
      expect(message).toBeNull();
    });
  });

  describe('Styling', () => {
    it('applies user-specific styles for user messages', () => {
      const { container } = render(
        <ChatMessage
          role="user"
          content="User message"
        />
      );

      const messageDiv = container.querySelector('.justify-end');
      expect(messageDiv).toBeInTheDocument();
    });

    it('applies assistant-specific styles for assistant messages', () => {
      const { container } = render(
        <ChatMessage
          role="assistant"
          content="Assistant message"
        />
      );

      const messageDiv = container.querySelector('.justify-start');
      expect(messageDiv).toBeInTheDocument();
    });

    it('shows thinking animation when streaming with no content', () => {
      render(
        <ChatMessage
          role="assistant"
          content=""
          isStreaming={true}
        />
      );

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('does not show thinking animation when not streaming', () => {
      render(
        <ChatMessage
          role="assistant"
          content=""
          isStreaming={false}
        />
      );

      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('shows copy button for assistant messages', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Test message to copy"
          isStreaming={false}
        />
      );

      const copyButton = screen.getByRole('button');
      expect(copyButton).toBeInTheDocument();
    });

    it('does not show copy button for user messages', () => {
      render(
        <ChatMessage
          role="user"
          content="User message"
        />
      );

      const copyButton = screen.queryByRole('button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('does not show copy button when streaming', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Streaming message"
          isStreaming={true}
        />
      );

      const copyButton = screen.queryByRole('button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('does not show copy button for empty content', () => {
      render(
        <ChatMessage
          role="assistant"
          content=""
          isStreaming={false}
        />
      );

      const copyButton = screen.queryByRole('button');
      expect(copyButton).not.toBeInTheDocument();
    });

    it('copies content to clipboard when copy button clicked', async () => {
      render(
        <ChatMessage
          role="assistant"
          content="Message to copy"
          isStreaming={false}
        />
      );

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Message to copy');
      });
    });

    it('shows check icon after copying', async () => {
      render(
        <ChatMessage
          role="assistant"
          content="Test message"
          isStreaming={false}
        />
      );

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        // Check icon should be visible
        expect(copyButton.querySelector('.text-green-600')).toBeInTheDocument();
      });
    });

  });

  describe('Markdown Rendering', () => {
    it('renders markdown in assistant messages', () => {
      render(
        <ChatMessage
          role="assistant"
          content="**Bold text** and *italic text*"
          isStreaming={false}
        />
      );

      // Markdown should be rendered (exact output depends on markdown parser)
      const content = screen.getByText(/Bold text/);
      expect(content).toBeInTheDocument();
    });

    it('renders plain text for user messages', () => {
      render(
        <ChatMessage
          role="user"
          content="**This should not be bold**"
        />
      );

      // Should render as plain text
      expect(screen.getByText('**This should not be bold**')).toBeInTheDocument();
    });

  });

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      render(
        <ChatMessage
          role="user"
          content={longMessage}
        />
      );

      // Should render without crashing
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters', () => {
      const specialChars = 'Hello 👋 🌍 <script>alert("xss")</script> 你好';
      render(
        <ChatMessage
          role="user"
          content={specialChars}
        />
      );

      // Should render special characters safely
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('handles line breaks', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      render(
        <ChatMessage
          role="user"
          content={multilineMessage}
        />
      );

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it('handles null timestamp gracefully', () => {
      render(
        <ChatMessage
          role="user"
          content="Test"
          timestamp={undefined}
        />
      );

      // Should render without errors
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Streaming State', () => {
    it('shows content while streaming', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Partial message..."
          isStreaming={true}
        />
      );

      expect(screen.getByText(/Partial message/)).toBeInTheDocument();
    });

    it('hides copy button during streaming', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Streaming content"
          isStreaming={true}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows copy button after streaming completes', () => {
      const { rerender } = render(
        <ChatMessage
          role="assistant"
          content="Completed message"
          isStreaming={true}
        />
      );

      // No copy button while streaming
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      // Rerender with streaming=false
      rerender(
        <ChatMessage
          role="assistant"
          content="Completed message"
          isStreaming={false}
        />
      );

      // Copy button should appear
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
