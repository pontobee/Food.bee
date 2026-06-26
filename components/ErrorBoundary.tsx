"use client";

import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error("ErrorBoundary", error.message, { stack: error.stack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-white font-bold text-lg">Algo deu errado</p>
            <p className="text-gray-500 text-sm mt-2">Recarregue a página para continuar.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white
                         rounded-lg text-sm font-semibold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
