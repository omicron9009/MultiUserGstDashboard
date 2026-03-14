import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight text-black sm:text-6xl md:text-7xl">
          Build something amazing
        </h1>
        <p className="mb-10 max-w-xl text-lg text-muted-foreground">
          A clean, minimalist foundation for your next project. Simple, fast, and ready to customize.
        </p>
        <Button 
          variant="default"
          className="h-12 bg-black px-8 text-base font-medium text-white hover:bg-gray-800"
        >
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-white px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 sm:grid-cols-3">
            <div className="text-center">
              <h3 className="mb-3 text-lg font-semibold text-black">Clean Design</h3>
              <p className="text-sm text-muted-foreground">
                Minimal and focused on what matters most to your users.
              </p>
            </div>
            <div className="text-center">
              <h3 className="mb-3 text-lg font-semibold text-black">Fast Performance</h3>
              <p className="text-sm text-muted-foreground">
                Built with modern tools for lightning-fast load times.
              </p>
            </div>
            <div className="text-center">
              <h3 className="mb-3 text-lg font-semibold text-black">Easy Customization</h3>
              <p className="text-sm text-muted-foreground">
                Ready to adapt to your brand and requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 Your Company. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
