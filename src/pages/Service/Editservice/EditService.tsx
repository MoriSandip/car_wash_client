/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import CarForm from "@/components/form/CarForm";
import CarInput from "@/components/form/CarInput";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface ServiceFormProps {
  onSubmit: (data: any) => void;
  defaultValues?: {
    image?: string[];
    title?: string;
    description?: string;
    price?: string | number;
    duration?: string | number;
  };
  UpdateLoading?: boolean;
}

const EditService: React.FC<ServiceFormProps> = ({
  onSubmit,
  defaultValues,
  UpdateLoading,
}) => {
  const [message, setMessage] = useState(defaultValues?.description || "");

  const [imageInput, setImageInput] = useState<string>(
    defaultValues?.image?.join(", ") || ""
  );

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(e.target.value);
  };

  const handleImageInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setImageInput(e.target.value);
  };

  const handleFormSubmit = (data: any) => {
    const payload = {
      title: String(data.title || "").trim(),
      description: message.trim(),
      price: String(data.price ?? ""),
      duration: Number(data.duration),
      image: imageInput
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <Card className="w-[80%] mx-auto mt-4 p-6">
      <CarForm
        onSubmit={handleFormSubmit}
        defaultValues={defaultValues}
        className="space-y-4"
      >
        <div>
          <CarInput
            type="text"
            name="title"
            label="Title"
            placeholder="Title"
          />
        </div>

        <div>
          <CarInput
            type="number"
            name="price"
            label="Price"
            placeholder="Price"
          />
        </div>

        <div>
          <CarInput
            type="number"
            name="duration"
            label="Duration (minutes)"
            placeholder="Duration"
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <Textarea
            id="description"
            name="description"
            placeholder="Type your description here."
            value={message}
            onChange={handleTextareaChange}
          />
        </div>

        <div>
          <label htmlFor="image">Image URLs (comma-separated)</label>
          <Textarea
            id="image"
            name="image"
            placeholder="Enter image URLs separated by commas"
            value={imageInput}
            onChange={handleImageInputChange}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={UpdateLoading}
        >
          {UpdateLoading ? "Loading..." : "Submit"}
        </Button>
      </CarForm>
    </Card>
  );
};

export default EditService;