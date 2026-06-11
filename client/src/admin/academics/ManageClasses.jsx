import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, GraduationCap, Loader2, Check, X, BookOpen, Monitor } from "lucide-react";
import API from "../../services/api";

const TYPE_OPTIONS = [
  { value: "school", label: "School Class (1-12)", icon: "🏫" },
  { value: "college", label: "College Course (BA/BSc/BCom)", icon: "🎓" },
  { value: "professional", label: "Professional Course (Computer etc.)", icon: "💻" },
];

const TYPE_COLORS = {
  school: "bg-blue-100 text-blue-700",
  college: "bg-purple-100 text-purple-700",
  professional: "bg-green-100 text-green-700",
};

const TYPE_LABELS = {
  school: "School",
  college: "College",
  professional: "Professional",
};

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  /* FORM STATE */
  const [type, setType] = useState("school");
  const [name, setName] = useState("");
  const [hasStreams, setHasStreams] = useState(false);
  const [order, setOrder] = useState("");

  /* EDIT STATE */
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  /* FETCH */
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/classes");
      const list = res.data?.data || [];
      setClasses(list);
    } catch (err) {
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  /* RESET FORM */
  const resetForm = () => {
    setName("");
    setHasStreams(false);
    setOrder("");
    setError("");
  };

  /* ADD */
  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Name required"); return; }

    if (type === "school") {
      const num = Number(trimmed);
      if (!num || num < 1 || num > 12) {
        setError("School class must be between 1 and 12");
        return;
      }
    }

    try {
      setAdding(true);
      setError("");
      await API.post("/classes", {
        name: trimmed,
        type,
        hasStreams: type !== "school" ? hasStreams : undefined,
        order: order ? Number(order) : undefined,
      });
      resetForm();
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || "Add failed");
    } finally {
      setAdding(false);
    }
  };

  /* DELETE */
  const handleDelete = async (id, displayName) => {
    if (!window.confirm("Delete \"" + displayName + "\"?")) return;
    try {
      await API.delete("/classes/" + id);
      setClasses((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  /* EDIT SAVE */
  const handleEditSave = async (cls) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await API.put("/classes/" + cls._id, { name: trimmed });
      fetchClasses();
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  /* GROUP BY TYPE */
  const grouped = {
    school: classes.filter((c) => c.type === "school"),
    college: classes.filter((c) => c.type === "college"),
    professional: classes.filter((c) => c.type === "professional" || !c.type),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <GraduationCap className="text-blue-600" />
        Manage Classes & Courses
      </h1>

      {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* ADD FORM */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Add New</h2>

        {/* TYPE SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setType(opt.value); resetForm(); }}
              className={"p-3 rounded-xl border-2 text-left text-sm font-medium transition " + (type === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}
            >
              <span className="text-xl block mb-1">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* INPUT */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type={type === "school" ? "number" : "text"}
            placeholder={type === "school" ? "Enter class number (1-12)" : type === "college" ? "e.g. BA, BSc, BCom, BCA" : "e.g. Computer Science, Tally, DTP"}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="border border-gray-200 p-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {type !== "school" && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasStreams}
                onChange={(e) => setHasStreams(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Has Streams/Semesters?
            </label>
          )}

          <button
            onClick={handleAdd}
            disabled={adding}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-60"
          >
            {adding ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Add</>}
          </button>
        </div>

        {type === "school" && (
          <p className="text-xs text-gray-400 mt-2">Classes 11 & 12 will automatically have stream selection (PCB/PCM/Arts)</p>
        )}
        {type === "college" && (
          <p className="text-xs text-gray-400 mt-2">Enable "Has Streams" if course has specializations (e.g. BA - History, Political Science)</p>
        )}
        {type === "professional" && (
          <p className="text-xs text-gray-400 mt-2">Enable "Has Streams" if course has levels (e.g. Basic, Advanced)</p>
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([groupType, items]) => (
            items.length > 0 && (
              <div key={groupType}>
                <h3 className={"inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full mb-3 " + TYPE_COLORS[groupType]}>
                  {groupType === "school" ? "🏫" : groupType === "college" ? "🎓" : "💻"}
                  {TYPE_LABELS[groupType]} ({items.length})
                </h3>

                <div className="space-y-3">
                  {items.map((cls) => (
                    <div key={cls._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {editingId === cls._id ? (
                          <input
                            type={cls.type === "school" ? "number" : "text"}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="border p-2 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-gray-800">
                            {cls.displayName || cls.name}
                          </span>
                        )}

                        {cls.hasStreams && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                            Has Streams
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {editingId === cls._id ? (
                          <>
                            <button onClick={() => handleEditSave(cls)} className="text-green-600 hover:text-green-700">
                              <Check size={20} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X size={20} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingId(cls._id); setEditingName(cls.name); setError(""); }} className="text-blue-600 hover:text-blue-700">
                            <Edit2 size={20} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(cls._id, cls.displayName || cls.name)} className="text-red-500 hover:text-red-600">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          {classes.length === 0 && (
            <p className="text-gray-400 text-center py-10">No classes or courses added yet</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageClasses;
