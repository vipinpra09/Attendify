import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  GraduationCap,
  Plus,
  School,
  Search,
  Send,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import {
  Badge,
  Button,
  Card,
  Confirm,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHead,
  SearchInput,
  Select,
  Spinner,
  useToast,
  cn,
} from "../components/ui";
import {
  fmtDate,
  type ClassRow,
  type Notice,
  type NoticePayload,
  type NoticeTargetType,
  type StudentRow,
} from "../lib/types";

export function NoticesPage() {
  const { token, user } = useAuth();
  const toast = useToast();

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";
  const canSendNotice = isAdmin || isTeacher;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // Filter & Search state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "URGENT" | "MINE" | "DIRECT" | "CLASS">("ALL");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [targetType, setTargetType] = useState<NoticeTargetType>("ALL");
  const [targetClassId, setTargetClassId] = useState("");
  const [targetStudentId, setTargetStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm state
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await api.notices.list(token);
      setNotices(data);
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotices();

    if (canSendNotice) {
      api.classes.list(token).then(setClasses).catch(() => undefined);
      api.students.list(token).then(setStudents).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.push("warning", "Please provide a notice title.");
    if (!content.trim()) return toast.push("warning", "Please provide notice content.");

    if (targetType === "CLASS" && !targetClassId) {
      return toast.push("warning", "Please select a target class.");
    }
    if (targetType === "STUDENT" && !targetStudentId) {
      return toast.push("warning", "Please select a target student.");
    }

    setSubmitting(true);
    try {
      const payload: NoticePayload = {
        title: title.trim(),
        content: content.trim(),
        targetType,
        targetClassId: targetType === "CLASS" ? targetClassId : undefined,
        targetStudentId: targetType === "STUDENT" ? targetStudentId : undefined,
        priority,
      };

      await api.notices.create(token, payload);
      toast.push("success", "Notice posted successfully!");
      setModalOpen(false);
      resetForm();
      await fetchNotices();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Failed to send notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!noticeToDelete) return;
    setDeleting(true);
    try {
      await api.notices.remove(token, noticeToDelete.id);
      toast.push("success", "Notice deleted.");
      setNoticeToDelete(null);
      setNotices((prev) => prev.filter((n) => n.id !== noticeToDelete.id));
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Failed to delete notice.");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("NORMAL");
    setTargetType("ALL");
    setTargetClassId(classes[0]?.id ?? "");
    setTargetStudentId("");
    setStudentSearch("");
  };

  // Filter students for the dropdown based on studentSearch
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.enrollmentNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Filter notices for display
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      // Search matching
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesAuthor = n.postedByName.toLowerCase().includes(q);
        const matchesClass = n.targetClassName?.toLowerCase().includes(q);
        const matchesStudent = n.targetStudentName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesClass && !matchesStudent) {
          return false;
        }
      }

      // Tab filtering
      if (activeTab === "URGENT") return n.priority === "URGENT";
      if (activeTab === "MINE") return n.postedById === user?.id;
      if (activeTab === "DIRECT") return n.targetType === "STUDENT";
      if (activeTab === "CLASS") return n.targetType === "CLASS";
      return true;
    });
  }, [notices, query, activeTab, user]);

  return (
    <Layout
      title="Notice Board"
      sub="Official campus notices, class announcements, and personal updates"
    >
      <PageHead
        title="Notice Board"
        sub={
          isStudent
            ? "Campus broadcasts, your class notices, and individual advisories"
            : "Publish and manage campus announcements and student-specific notices"
        }
      >
        {canSendNotice && (
          <Button
            icon={Plus}
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            Send Notice
          </Button>
        )}
      </PageHead>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
              activeTab === "ALL"
                ? "bg-white text-night-900 shadow-sm"
                : "text-slate-600 hover:text-night-900"
            )}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => setActiveTab("URGENT")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
              activeTab === "URGENT"
                ? "bg-white text-bad-600 shadow-sm"
                : "text-slate-600 hover:text-bad-600"
            )}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Urgent ({notices.filter((n) => n.priority === "URGENT").length})
          </button>
          {isStudent && (
            <button
              onClick={() => setActiveTab("DIRECT")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
                activeTab === "DIRECT"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-slate-600 hover:text-brand-600"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Direct to Me ({notices.filter((n) => n.targetType === "STUDENT").length})
            </button>
          )}
          {canSendNotice && (
            <>
              <button
                onClick={() => setActiveTab("MINE")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
                  activeTab === "MINE"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-slate-600 hover:text-brand-600"
                )}
              >
                Sent by Me ({notices.filter((n) => n.postedById === user?.id).length})
              </button>
              <button
                onClick={() => setActiveTab("DIRECT")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
                  activeTab === "DIRECT"
                    ? "bg-white text-night-900 shadow-sm"
                    : "text-slate-600 hover:text-night-900"
                )}
              >
                Student-Specific ({notices.filter((n) => n.targetType === "STUDENT").length})
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("CLASS")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap",
              activeTab === "CLASS"
                ? "bg-white text-night-900 shadow-sm"
                : "text-slate-600 hover:text-night-900"
            )}
          >
            Class ({notices.filter((n) => n.targetType === "CLASS").length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Search by title, author, class..."
            value={query}
            onChange={setQuery}
          />
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-8 h-8 text-brand-600" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={query ? "No matching notices" : "No notices available"}
          hint={
            query
              ? "Try adjusting your search or tab filters."
              : canSendNotice
              ? "Click 'Send Notice' to publish your first announcement or advisory."
              : "Check back later for college and class announcements."
          }
          action={
            canSendNotice && !query ? (
              <Button
                icon={Plus}
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
              >
                Send Notice
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => {
            const isAuthor = n.postedById === user?.id;
            const canDelete = isAdmin || isAuthor;
            const isDirectToStudent =
              isStudent && n.targetType === "STUDENT" && n.targetStudentId === user?.personId;

            return (
              <Card
                key={n.id}
                className={cn(
                  "p-5 transition-all duration-200 hover:shadow-md",
                  isDirectToStudent
                    ? "border-brand-300 ring-2 ring-brand-100 bg-brand-50/20"
                    : n.priority === "URGENT"
                    ? "border-bad-200 bg-bad-50/10"
                    : ""
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority badge */}
                      {n.priority === "URGENT" ? (
                        <Badge tone="bad">
                          <AlertTriangle className="w-3 h-3" />
                          URGENT
                        </Badge>
                      ) : (
                        <Badge tone="brand">ANNOUNCEMENT</Badge>
                      )}

                      {/* Target badge */}
                      {n.targetType === "ALL" && (
                        <Badge tone="slate">
                          <Globe className="w-3 h-3 text-slate-500" />
                          All Students & Staff
                        </Badge>
                      )}
                      {n.targetType === "CLASS" && (
                        <Badge tone="ok">
                          <School className="w-3 h-3 text-ok-600" />
                          Class: {n.targetClassName ?? "Specific Class"}
                        </Badge>
                      )}
                      {n.targetType === "STUDENT" && (
                        <Badge tone="brand">
                          <User className="w-3 h-3 text-brand-600" />
                          To Student: {n.targetStudentName} ({n.targetStudentEnrollment})
                        </Badge>
                      )}

                      {isDirectToStudent && (
                        <Badge tone="ok" className="bg-ok-100 text-ok-800 font-extrabold">
                          Direct to You
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-[17px] text-night-900 leading-snug">
                      {n.title}
                    </h3>

                    <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => setNoticeToDelete(n)}
                      className="text-slate-400 hover:text-bad-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                      title="Delete Notice"
                      aria-label="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {n.postedByName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                      {n.postedByRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{fmtDate(n.createdAt ? n.createdAt.slice(0, 10) : "")}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Send Notice Modal */}
      {canSendNotice && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Send Notice"
          subtitle="Broadcast to all students, a specific class, or an individual student"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Notice Title" required>
              <Input
                placeholder="e.g. Mid-Term Examination Schedule or Assignment Due Date"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Target Audience" required>
                <Select
                  value={targetType}
                  onChange={(e) => {
                    const next = e.target.value as NoticeTargetType;
                    setTargetType(next);
                    if (next === "CLASS" && !targetClassId && classes.length > 0) {
                      setTargetClassId(classes[0]!.id);
                    }
                  }}
                >
                  <option value="ALL">🌐 All Students & Staff</option>
                  <option value="CLASS">🏫 Specific Class</option>
                  <option value="STUDENT">👤 Specific Student</option>
                </Select>
              </Field>

              <Field label="Priority">
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "NORMAL" | "URGENT")}
                >
                  <option value="NORMAL">Normal Announcement</option>
                  <option value="URGENT">⚠️ Urgent Alert</option>
                </Select>
              </Field>
            </div>

            {/* If target is CLASS */}
            {targetType === "CLASS" && (
              <Field label="Select Class" required>
                <Select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.branch} Sem {c.semester} - Section {c.section})
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {/* If target is STUDENT */}
            {targetType === "STUDENT" && (
              <div className="space-y-2 p-3.5 rounded-xl border border-brand-200 bg-brand-50/30">
                <p className="text-[12px] font-bold text-brand-900 uppercase tracking-wide">
                  Target Specific Student *
                </p>
                <div className="relative">
                  <SearchInput
                    placeholder="Search by student name or roll number..."
                    value={studentSearch}
                    onChange={setStudentSearch}
                  />
                </div>
                <Select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  required
                  size={4}
                  className="h-36 overflow-y-auto"
                >
                  {filteredStudents.length === 0 ? (
                    <option disabled>No students matching search</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s.id} value={s.id} className="py-1">
                        {s.name} — {s.enrollmentNo} ({s.className})
                      </option>
                    ))
                  )}
                </Select>
                {targetStudentId && (
                  <p className="text-[12px] text-ok-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected:{" "}
                    {students.find((s) => s.id === targetStudentId)?.name} (
                    {students.find((s) => s.id === targetStudentId)?.enrollmentNo})
                  </p>
                )}
              </div>
            )}

            <Field label="Notice Message" required>
              <textarea
                className="w-full rounded-lg border border-slate-300 p-3 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-32 leading-relaxed"
                placeholder="Write the full notice details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </Field>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={Send}>
                Send Notice
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      <Confirm
        open={Boolean(noticeToDelete)}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Notice"
        message={
          noticeToDelete
            ? `Are you sure you want to delete "${noticeToDelete.title}"? This cannot be undone.`
            : ""
        }
      />
    </Layout>
  );
}
