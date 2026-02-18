"use client";

import { useState, ReactNode } from "react";

interface CodeExample {
  label: string;
  language: string;
  code: string;
}

interface CodePanelProps {
  examples: CodeExample[];
  activeTab?: string;
}

export function CodePanel({ examples, activeTab }: CodePanelProps) {
  const [selectedTab, setSelectedTab] = useState(activeTab || examples[0]?.label);
  const [copied, setCopied] = useState(false);

  const activeExample = examples.find((e) => e.label === selectedTab) || examples[0];

  const handleCopy = async () => {
    if (!activeExample) return;
    await navigator.clipboard.writeText(activeExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!examples.length) return null;

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        {examples.map((example) => (
          <button
            key={example.label}
            onClick={() => setSelectedTab(example.label)}
            className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              selectedTab === example.label
                ? "text-white bg-zinc-800 border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 hover:text-white transition-colors z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
          <code className="text-zinc-300">
            {activeExample?.code.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="text-zinc-600 select-none w-8 shrink-0 text-right pr-4">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <SyntaxLine line={line} />
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Token types for syntax highlighting
type TokenType = 'keyword' | 'string' | 'comment' | 'tag' | 'prop' | 'type' | 'text';

interface Token {
  type: TokenType;
  value: string;
}

// Simple tokenizer for syntax highlighting (no dangerouslySetInnerHTML)
function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Comments
    if (remaining.startsWith('//')) {
      tokens.push({ type: 'comment', value: remaining });
      break;
    }

    // Strings (single, double, backtick)
    const stringMatch = remaining.match(/^(['"`])(?:(?!\1)[^\\]|\\.)*\1/);
    if (stringMatch) {
      tokens.push({ type: 'string', value: stringMatch[0] });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // JSX tags
    const tagMatch = remaining.match(/^<\/?[A-Za-z][A-Za-z0-9]*/);
    if (tagMatch) {
      tokens.push({ type: 'tag', value: tagMatch[0] });
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }

    // Keywords
    const keywordMatch = remaining.match(/^(import|export|from|const|let|var|function|return|if|else|async|await|new|type|interface|useEffect|useState)\b/);
    if (keywordMatch) {
      tokens.push({ type: 'keyword', value: keywordMatch[0] });
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }

    // Props (word followed by =)
    const propMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?==)/);
    if (propMatch) {
      tokens.push({ type: 'prop', value: propMatch[1] });
      remaining = remaining.slice(propMatch[1].length);
      continue;
    }

    // Type annotations (: TypeName)
    const typeMatch = remaining.match(/^:\s*([A-Z][a-zA-Z0-9<>[\]|&\s]*)/);
    if (typeMatch) {
      tokens.push({ type: 'text', value: ': ' });
      tokens.push({ type: 'type', value: typeMatch[1] });
      remaining = remaining.slice(typeMatch[0].length);
      continue;
    }

    // Regular text (consume one character at a time for non-matches, or chunks of plain text)
    const plainMatch = remaining.match(/^[^'"`</:=a-zA-Z]+|^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (plainMatch) {
      tokens.push({ type: 'text', value: plainMatch[0] });
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    // Fallback: consume single character
    tokens.push({ type: 'text', value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

function SyntaxLine({ line }: { line: string }): ReactNode {
  const tokens = tokenize(line);

  return (
    <>
      {tokens.map((token, i) => {
        const className = {
          keyword: 'text-purple-400',
          string: 'text-green-400',
          comment: 'text-zinc-600',
          tag: 'text-blue-400',
          prop: 'text-yellow-300',
          type: 'text-cyan-400',
          text: '',
        }[token.type];

        return (
          <span key={i} className={className}>
            {token.value}
          </span>
        );
      })}
    </>
  );
}

// Pre-defined code examples for the demo
export const CODE_EXAMPLES = {
  setup: {
    label: "Setup",
    language: "tsx",
    code: `// providers.tsx
import { PrivyProvider } from "@privy-io/react-auth";
import { DepositProvider, CHAIN } from "@particle-network/deposit-sdk/react";

export function Providers({ children }) {
  return (
    <PrivyProvider appId="your-privy-app-id">
      <DepositProvider config={{
        destination: { chainId: CHAIN.POLYGON },
        autoSweep: true,
        minValueUSD: 1,
      }}>
        {children}
      </DepositProvider>
    </PrivyProvider>
  );
}`,
  },

  modal: {
    label: "Modal",
    language: "tsx",
    code: `// Using DepositModal
import { useState } from "react";
import { useDeposit, DepositModal } from "@particle-network/deposit-sdk/react";

function DepositButton({ ownerAddress }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isReady } = useDeposit({ ownerAddress });

  return (
    <>
      <button onClick={() => setIsOpen(true)} disabled={!isReady}>
        Open Deposit
      </button>

      <DepositModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        theme="dark"
      />
    </>
  );
}`,
  },

  inline: {
    label: "Inline",
    language: "tsx",
    code: `// Using DepositWidget (embedded)
import { useDeposit, DepositWidget } from "@particle-network/deposit-sdk/react";

function DepositPage({ ownerAddress }) {
  const { isReady } = useDeposit({ ownerAddress });

  if (!isReady) return <Loading />;

  return (
    <div className="deposit-container">
      <h2>Deposit Funds</h2>
      <DepositWidget theme="dark" fullWidth />
    </div>
  );
}`,
  },

  headless: {
    label: "Headless",
    language: "tsx",
    code: `// Headless mode - full control, custom UI
import { useDeposit, CHAIN } from "@particle-network/deposit-sdk/react";

function CustomDepositUI({ ownerAddress }) {
  const {
    isReady,
    depositAddresses,
    pendingDeposits,
    status,
    sweep,
  } = useDeposit({ ownerAddress });

  if (!isReady) return <Loading />;

  return (
    <div>
      {/* Show deposit addresses */}
      <div>
        <h3>Send funds to:</h3>
        <p>EVM: {depositAddresses.evm}</p>
        <p>Solana: {depositAddresses.solana}</p>
      </div>

      {/* Show pending deposits */}
      {pendingDeposits.map((deposit) => (
        <div key={deposit.id}>
          {deposit.token}: \${deposit.amountUSD.toFixed(2)}
          <button onClick={() => sweep(deposit.id)}>
            Sweep Now
          </button>
        </div>
      ))}

      {/* Status indicator */}
      <p>Status: {status}</p>
    </div>
  );
}`,
  },

  events: {
    label: "Events",
    language: "tsx",
    code: `// Listening to deposit events
import { useDepositContext } from "@particle-network/deposit-sdk/react";

function DepositTracker() {
  const { client, isReady } = useDepositContext();

  useEffect(() => {
    if (!client) return;

    const handleDetected = (deposit) => {
      console.log("Deposit detected:", deposit);
    };

    const handleComplete = (result) => {
      console.log("Sweep complete:", result);
    };

    client.on("deposit:detected", handleDetected);
    client.on("deposit:complete", handleComplete);

    return () => {
      client.off("deposit:detected", handleDetected);
      client.off("deposit:complete", handleComplete);
    };
  }, [client]);

  return <div>Listening for deposits...</div>;
}`,
  },
};
