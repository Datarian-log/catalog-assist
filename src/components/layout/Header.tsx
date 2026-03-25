"use client";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              AI Library Cataloger
            </h1>
            <p className="text-sm text-gray-500">
              MARC21 Record Generator · RDA / LCSH / LCC
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
