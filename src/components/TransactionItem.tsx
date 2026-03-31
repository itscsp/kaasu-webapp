import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Transaction, Tag } from "@/lib/api";
import { useData } from "@/context/DataContext";

interface Props {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionItem({ transaction, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [deleted, setDeleted] = useState(false);


  const sign = transaction.type === "transfer" ? "" : transaction.type === "income" ? "+" : "-";
  const dateObj = new Date(transaction.date);
  const day = dateObj.getDate();

  const { accounts } = useData();
  const fromAccount = accounts?.find(a => a.id === transaction.account_id);
  const toAccount = accounts?.find(a => a.id === transaction.to_account_id);

  return (
    <div className="transaction-item">
      <button
        className="transaction-row"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="transaction-date-badge">{day}</div>
        <div className="transaction-amount">
          {sign} {Math.abs(Number(transaction.amount) || 0).toLocaleString()}
        </div>
        {expanded ? (
          <ChevronUp size={16} className="ml-auto text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="ml-auto text-gray-500 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="transaction-detail">
          {(fromAccount || toAccount) && (
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mb-2 bg-black/20 p-2 rounded-md">
              {fromAccount && (
                <span className="truncate max-w-[45%] font-medium text-[hsl(var(--foreground))]">{fromAccount.name}</span>
              )}
              {fromAccount && toAccount && (
                <ArrowRight size={12} className="flex-shrink-0 opacity-50" />
              )}
              {toAccount && (
                <span className="truncate max-w-[45%] font-medium text-[hsl(var(--foreground))]">{toAccount.name}</span>
              )}
            </div>
          )}
          {transaction.notes && (
            <p className="text-sm text-gray-400 mb-2">{transaction.notes}</p>
          )}
          {transaction.tag_objects && transaction.tag_objects.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {transaction.tag_objects.map((tag: Tag) => (
                <span key={tag.id} className="tag-badge">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button
              className="sketch-btn flex-1"
              onClick={() => onEdit(transaction)}
            >
              Update
            </button>
            {deleted ?
              (<button
                className="sketch-btn sketch-btn-danger flex-1"
                onClick={() => onDelete(transaction.id)}
              >Are you sure?
              </button>) :
              (<button
                className="sketch-btn sketch-btn-danger flex-1"
                onClick={() => setDeleted(true)}
              >
                Delete
              </button>)
            }
          </div>
        </div>
      )}
    </div>
  );
}
