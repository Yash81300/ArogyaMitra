export default function BackgroundImage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}