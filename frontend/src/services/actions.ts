import {
  addAssistantMessage,
  addAssistantAction,
  addUserMessage,
  addErrorMessage,
} from "#/state/chat-slice";
import { trackError } from "#/utils/error-handler";
import { appendSecurityAnalyzerInput } from "#/state/security-analyzer-slice";
import { setCode, setActiveFilepath } from "#/state/code-slice";
import { appendJupyterInput } from "#/state/jupyter-slice";
import { setCurStatusMessage } from "#/state/status-slice";
import { setMetrics } from "#/state/metrics-slice";
import store from "#/store";
import ActionType from "#/types/action-type";
import {
  ActionMessage,
  ObservationMessage,
  StatusMessage,
} from "#/types/message";
import { handleObservationMessage } from "./observations";
import { appendInput } from "#/state/command-slice";

const messageActions = {
  [ActionType.BROWSE]: (message: ActionMessage) => {
    if (!message.args.thought && message.message) {
      store.dispatch(addAssistantMessage(message.message));
    }
  },
  [ActionType.BROWSE_INTERACTIVE]: (message: ActionMessage) => {
    if (!message.args.thought && message.message) {
      store.dispatch(addAssistantMessage(message.message));
    }
  },
  [ActionType.WRITE]: (message: ActionMessage) => {
    const { path, content } = message.args;
    store.dispatch(setActiveFilepath(path));
    store.dispatch(setCode(content));
  },
  [ActionType.MESSAGE]: (message: ActionMessage) => {
    if (message.source === "user") {
      store.dispatch(
        addUserMessage({
          content: message.args.content,
          imageUrls:
            typeof message.args.image_urls === "string"
              ? [message.args.image_urls]
              : message.args.image_urls,
          timestamp: message.timestamp,
          pending: false,
        }),
      );
    } else {
      store.dispatch(addAssistantMessage(message.args.content));
    }
  },
  [ActionType.RUN_IPYTHON]: (message: ActionMessage) => {
    if (message.args.confirmation_state !== "rejected") {
      store.dispatch(appendJupyterInput(message.args.code));
    }
  },
  [ActionType.FINISH]: (message: ActionMessage) => {
    store.dispatch(addAssistantMessage(message.args.final_thought));
    let successPrediction = "";
    if (message.args.task_completed === "partial") {
      successPrediction =
        "I believe that the task was **completed partially**.";
    } else if (message.args.task_completed === "false") {
      successPrediction = "I believe that the task was **not completed**.";
    } else if (message.args.task_completed === "true") {
      successPrediction =
        "I believe that the task was **completed successfully**.";
    }
    if (successPrediction) {
      // if final_thought is not empty, add a new line before the success prediction
      if (message.args.final_thought) {
        store.dispatch(addAssistantMessage(`\n${successPrediction}`));
      } else {
        store.dispatch(addAssistantMessage(successPrediction));
      }
    }
  },
};

export function handleActionMessage(message: ActionMessage) {
  if (message.args?.hidden) {
    return;
  }

  // Update metrics if available
  if (message.llm_metrics) {
    const metrics = {
      cost: message.llm_metrics?.accumulated_cost ?? null,
      usage: message.llm_metrics?.accumulated_token_usage ?? null,
    };
    store.dispatch(setMetrics(metrics));
  }

  if (message.action === ActionType.RUN) {
    store.dispatch(appendInput(message.args.command));
  }

  if ("args" in message && "security_risk" in message.args) {
    store.dispatch(appendSecurityAnalyzerInput(message));
  }

  if (message.source === "agent") {
    // Only add thought as a message if it's not a "think" action
    if (
      message.args &&
      message.args.thought &&
      message.action !== ActionType.THINK
    ) {
      store.dispatch(addAssistantMessage(message.args.thought));
    }
    // Need to convert ActionMessage to RejectAction
    // @ts-expect-error TODO: fix
    store.dispatch(addAssistantAction(message));
  }

  if (message.action in messageActions) {
    const actionFn =
      messageActions[message.action as keyof typeof messageActions];
    actionFn(message);
  }
}

export function handleStatusMessage(message: StatusMessage) {
  if (message.type === "info") {
    store.dispatch(
      setCurStatusMessage({
        ...message,
      }),
    );
  } else if (message.type === "error") {
    trackError({
      message: message.message,
      source: "chat",
      metadata: { msgId: message.id },
    });
    store.dispatch(
      addErrorMessage({
        ...message,
      }),
    );
  }
}

export function handleAssistantMessage(message: Record<string, unknown>) {
  if (message.action) {
    handleActionMessage(message as unknown as ActionMessage);
  } else if (message.observation) {
    handleObservationMessage(message as unknown as ObservationMessage);
  } else if (message.status_update) {
    handleStatusMessage(message as unknown as StatusMessage);
  } else if (message.error) {
    // Handle error messages from the server
    const errorMessage =
      typeof message.message === "string"
        ? message.message
        : String(message.message || "Unknown error");
    trackError({
      message: errorMessage,
      source: "websocket",
      metadata: { raw_message: message },
    });
    store.dispatch(
      addErrorMessage({
        message: errorMessage,
      }),
    );
  } else {
    const errorMsg = "Unknown message type received";
    trackError({
      message: errorMsg,
      source: "chat",
      metadata: { raw_message: message },
    });
    store.dispatch(
      addErrorMessage({
        message: errorMsg,
      }),
    );
  }
}
