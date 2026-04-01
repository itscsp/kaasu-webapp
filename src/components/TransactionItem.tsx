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
  const fromAccount = accounts?.find(a => a.id === transaction.from_account_id);
  const toAccount = accounts?.find(a => a.id === transaction.to_account_id);

  return (
    <div className="transaction-item">
      <button
        className="transaction-row"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="transaction-date-badge">{day}</div>
        <div className="transaction-info">
          <div className="transaction-notes">
            {transaction.notes || (transaction.type === "transfer" ? "Transfer" : "No description")}
          </div>
          <div className={`transaction-amount ${transaction.type}`}>
            {sign} ₹{Math.abs(Number(transaction.amount) || 0).toLocaleString()}
            {transaction.type === "transfer" && <span className="badge-transfer">Transfer</span>}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="transaction-detail">
          {(fromAccount || toAccount) && (
            <div className="flex items-center gap-2 text-[9px] text-[hsl(var(--muted-foreground))] mb-3 bg-white/5 p-2 rounded-lg border border-white/5 overflow-hidden">
              {transaction.type === 'transfer' ? (
                <>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-gray-600">From</span>
                    <span className="truncate font-medium text-[hsl(var(--foreground))]">{fromAccount?.name || "???"}</span>
                  </div>
                  <ArrowRight size={10} className="flex-shrink-0 opacity-50 mt-2" />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-gray-600">To</span>
                    <span className="truncate font-medium text-[hsl(var(--foreground))]">{toAccount?.name || "???"}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[7px] font-bold uppercase tracking-widest text-gray-600">
                    {transaction.type === 'income' ? 'Deposited To' : 'Paid From'}
                  </span>
                  <span className="truncate font-medium text-[hsl(var(--foreground))]">
                    {(transaction.type === 'income' ? toAccount?.name : fromAccount?.name) || "Not connected"}
                  </span>
                </div>
              )}
            </div>
          )}
          {transaction.tag_objects && transaction.tag_objects.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {transaction.tag_objects.map((tag: Tag) => (
                <span key={tag.id} className="tag-badge text-[10px] py-0.5 px-2">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button
              className="sketch-btn flex-1 py-1.5 text-xs"
              onClick={() => onEdit(transaction)}
            >
              Update
            </button>
            {deleted ?
              (<button
                className="sketch-btn sketch-btn-danger flex-1 py-1.5 text-xs"
                onClick={() => onDelete(transaction.id)}
              >Are you sure?
              </button>) :
              (<button
                className="sketch-btn sketch-btn-danger flex-1 py-1.5 text-xs"
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
