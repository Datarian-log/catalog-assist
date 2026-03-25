"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InputTabs from "@/components/input/InputTabs";
import TextInputForm from "@/components/input/TextInputForm";
import ImageUploadForm from "@/components/input/ImageUploadForm";
import MarcRecordDisplay from "@/components/marc/MarcRecordDisplay";
import SubjectSelector from "@/components/marc/SubjectSelector";
import ExportButtons from "@/components/export/ExportButtons";
import { useCatalog } from "@/hooks/useCatalog";
import { AiProvider } from "@/lib/marc/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [titlePageText, setTitlePageText] = useState("");
  const [versoText, setVersoText] = useState("");
  const [provider, setProvider] = useState<AiProvider>("claude");
  const {
    record,
    warnings,
    subjectCandidates,
    fieldSources,
    isLoading,
    error,
    subjectsApplied,
    generate,
    applySubjects,
  } = useCatalog();

  const handleSubmit = () => {
    if (titlePageText.trim()) {
      generate(titlePageText, versoText, provider);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
          {/* Input Section */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <InputTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="mt-4">
              {activeTab === "text" ? (
                <TextInputForm
                  titlePageText={titlePageText}
                  versoText={versoText}
                  onTitlePageChange={setTitlePageText}
                  onVersoChange={setVersoText}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  provider={provider}
                  onProviderChange={setProvider}
                />
              ) : (
                <ImageUploadForm
                  onTextExtracted={(title, verso) => {
                    setTitlePageText(title);
                    setVersoText(verso);
                  }}
                  onSubmit={handleSubmit}
                  titlePageText={titlePageText}
                  versoText={versoText}
                  onTitlePageChange={setTitlePageText}
                  onVersoChange={setVersoText}
                  isLoading={isLoading}
                  provider={provider}
                  onProviderChange={setProvider}
                />
              )}
            </div>
          </section>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm text-gray-500">
                  Analyzing text and generating MARC record...
                </p>
              </div>
            </div>
          )}

          {/* Subject Heading Selection */}
          {record && !isLoading && subjectCandidates.length > 0 && !subjectsApplied && (
            <section className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
              <SubjectSelector
                candidateGroups={subjectCandidates}
                onConfirm={applySubjects}
              />
            </section>
          )}

          {/* MARC Record Display */}
          {record && !isLoading && (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
              <MarcRecordDisplay record={record} warnings={warnings} fieldSources={fieldSources} />
              {subjectsApplied && <ExportButtons record={record} />}
              {!subjectsApplied && subjectCandidates.length > 0 && (
                <p className="text-sm text-gray-400 italic">
                  Select subject headings above to complete the record and enable export.
                </p>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
