import { useEffect, useRef } from 'react';
import { TEndpointOption, getResponseSender } from 'librechat-data-provider';
import type { KeyboardEvent } from 'react';
import { useChatContext } from '~/Providers/ChatContext';
import useFileHandling from '~/hooks/useFileHandling';
import useLocalize from '~/hooks/useLocalize';

type KeyEvent = KeyboardEvent<HTMLTextAreaElement>;

export default function useTextarea({ setText, submitMessage, disabled = false }) {
  const { conversation, isSubmitting, latestMessage, setShowBingToneSetting, setFilesLoading } =
    useChatContext();
  const isComposing = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { handleFiles } = useFileHandling();
  const localize = useLocalize();

  const isNotAppendable = (latestMessage?.unfinished && !isSubmitting) || latestMessage?.error;
  const { conversationId, jailbreak } = conversation || {};

  // auto focus to input, when enter a conversation.
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    // Prevents Settings from not showing on new conversation, also prevents showing toneStyle change without jailbreak
    if (conversationId === 'new' || !jailbreak) {
      setShowBingToneSetting(false);
    }

    if (conversationId !== 'search') {
      inputRef.current?.focus();
    }
    // setShowBingToneSetting is a recoil setter, so it doesn't need to be in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, jailbreak]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isSubmitting]);

  const handleKeyDown = (e: KeyEvent) => {
    if (e.key === 'Enter' && isSubmitting) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }

    if (e.key === 'Enter' && !e.shiftKey && !isComposing?.current) {
      submitMessage();
    }
  };

  const handleKeyUp = (e: KeyEvent) => {
    const target = e.target as HTMLTextAreaElement;

    if (e.keyCode === 8 && target.value.trim() === '') {
      setText(target.value);
    }

    if (e.key === 'Enter' && e.shiftKey) {
      return console.log('Enter + Shift');
    }

    if (isSubmitting) {
      return;
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
  };

  const getPlaceholderText = () => {
    if (disabled) {
      return localize('com_endpoint_config_placeholder');
    }
    if (isNotAppendable) {
      return localize('com_endpoint_message_not_appendable');
    }

    const sender = getResponseSender(conversation as TEndpointOption);

    return `${localize('com_endpoint_message')} ${sender ? sender : 'ChatGPT'}…`;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      setFilesLoading(true);
      handleFiles(e.clipboardData.files);
    }
  };

  return {
    inputRef,
    handleKeyDown,
    handleKeyUp,
    handlePaste,
    handleCompositionStart,
    handleCompositionEnd,
    placeholder: getPlaceholderText(),
  };
}
