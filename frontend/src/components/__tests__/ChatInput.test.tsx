/**
 * Comprehensive tests for ChatInput component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput Component', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnCancelStream = vi.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
    mockOnCancelStream.mockClear();
  });

  describe('Rendering', () => {
    it('renders textarea and send button', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByPlaceholderText('Message...');
      expect(textarea).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          placeholder="Type your message here..."
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message here...');
      expect(textarea).toBeInTheDocument();
    });

    it('shows send icon when not streaming', () => {
      const { container } = render(
        <ChatInput onSendMessage={mockOnSendMessage} isStreaming={false} />
      );

      // Send icon should be visible (lucide-react renders SVG)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows stop icon when streaming', () => {
      const { container } = render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
          onCancelStream={mockOnCancelStream}
        />
      );

      // Square (stop) icon should be visible
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('allows typing in textarea', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'Hello world');

      expect(textarea.value).toBe('Hello world');
    });

    it('updates textarea value on change', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      expect(textarea.value).toBe('Test message');
    });

    it('handles multiline input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(textarea.value).toContain('Line 1');
      expect(textarea.value).toContain('Line 2');
    });

    it('clears input after sending message', async () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Message to send' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });
  });

  describe('Send Message', () => {
    it('sends message when button clicked', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('sends message when Enter key pressed', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Enter test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSendMessage).toHaveBeenCalledWith('Enter test');
    });

    it('does not send on Shift+Enter', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Shift Enter test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('trims whitespace from message', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '  Message with spaces  ' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Message with spaces');
    });

    it('does not send empty message', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('does not send whitespace-only message', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Button State', () => {
    it('disables send button when input is empty', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('enables send button when input has content', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Some text' } });

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('disables send button when input is only whitespace', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('enables button during streaming', () => {
      render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
          onCancelStream={mockOnCancelStream}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Streaming State', () => {
    it('does not send message when streaming', () => {
      render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
          onCancelStream={mockOnCancelStream}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('calls cancel stream when button clicked during streaming', () => {
      render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
          onCancelStream={mockOnCancelStream}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnCancelStream).toHaveBeenCalled();
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('does nothing if cancel button clicked but no handler provided', () => {
      render(
        <ChatInput
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should not crash
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Auto-resize', () => {
    it('maintains textarea after sending message', async () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Set some text
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Send message
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        // Textarea should be cleared after send
        expect(textarea.value).toBe('');
      });
    });

    it('adjusts height based on content', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        value: 150,
        writable: true,
      });

      fireEvent.change(textarea, { target: { value: 'Multi\nLine\nText' } });

      // Height should be updated (implementation may vary)
      expect(textarea.style.height).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows Shift+Enter to add new line', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Line 1' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      // Should not send message
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('sends message on Enter key without Shift', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      // Message should be sent
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const longText = 'a'.repeat(5000);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: longText } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).toHaveBeenCalledWith(longText);
    });

    it('handles special characters', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const specialText = '👋 Hello <script>alert("xss")</script> 你好';
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: specialText } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnSendMessage).toHaveBeenCalledWith(specialText);
    });

    it('handles rapid button clicks', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      const button = screen.getByRole('button');

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only send once (input is cleared after first send)
      expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('textarea is accessible', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('button is accessible', () => {
      render(<ChatInput onSendMessage={mockOnSendMessage} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
