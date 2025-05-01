import { useState } from "react";
import "../styles/Main.css";

export default function PinForm({ lat, lng, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    tags: [],
  });

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  function handleTagsChange(e) {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, tags: selected }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const username = localStorage.getItem("username") || "anonim";

    const jsonBody = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      tags: formData.tags,
      latitude: lat.toString(),
      longitude: lng.toString(),
      createdBy: username,
    };

    const res = await fetch(import.meta.env.VITE_API_URL + "/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonBody),
    });

    if (!res.ok) {
      const errMsg = await res.text();
      console.error("⛔ Sunucu cevabı:", errMsg);
      alert("Pin kaydedilirken hata oluştu");
      return;
    }

    const newPin = await res.json();
    onSuccess(newPin);
  }

  // async function handleSubmit(e) {
  //   e.preventDefault();

  //   const data = new FormData();
  //   data.append("title", formData.title);
  //   data.append("category", formData.category);
  //   data.append("description", formData.description);
  //   data.append("createdBy", "testuser");

  //   if (formData.tags.length) {
  //     data.append("tags", JSON.stringify(formData.tags));
  //   }

  //   if (formData.image) {
  //     data.append("image", formData.image);
  //   }

  //   try {
  //     const res = await fetch(import.meta.env.VITE_API_URL + "/api/pins", {
  //       method: "POST",
  //       body: data,
  //     });
  //     const result = await res.json();
  //     console.log("✅ Pin eklendi:", result);

  //     setFormData({
  //       title: "",
  //       category: "",
  //       description: "",
  //       image: null,
  //       tags: [],
  //     });
  //   } catch (err) {
  //     console.error("❌ Hata oluştu:", err);
  //   }
  // }

  return (
    <form
      id="pin-form"
      className="pin-form"
      onSubmit={handleSubmit}
      // onSubmit={handleSubmit}
      // encType="multipart/form-data"
    >
      <input
        type="text"
        name="title"
        placeholder="title"
        required
        onChange={handleChange}
      />
      <select
        name="category"
        id="pin-category"
        required
        onChange={handleChange}
      >
        <option value="">Select category</option>
        <option value="food-drink">Food & Drink</option>
        <option value="cultural">Cultural</option>
        <option value="accommodation">Accommodation</option>
        <option value="entertainment">Entertainment</option>
        <option value="nature">Nature</option>
        <option value="other">Other</option>
      </select>
      <label>
        Tags
        <select
          name="tags"
          multiple
          value={formData.tags}
          onChange={handleTagsChange}
        >
          <option value="free">Free</option>
          <option value="$">$</option>
          <option value="$$">$$</option>
          <option value="$$$">$$$</option>
          <option value="touristic">Touristic</option>
          <option value="local">Local</option>
          <option value="new">New</option>
          <option value="crowded">Crowded</option>
          <option value="quiet">Quiet</option>
        </select>
      </label>
      <textarea
        name="description"
        placeholder="description"
        required
        onChange={handleChange}
      ></textarea>
      <input
        className="file-input"
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
      />
      <button id="form-submit" type="submit">
        Submit
      </button>
    </form>
  );
}
