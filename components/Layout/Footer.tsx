import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/95 py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-foreground">KnowledgeSync</p>
            <p>Built with Next.js, React, PostgreSQL, and Tailwind CSS</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="https://github.com/Dileep0xkush"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
              title="GitHub Profile"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>

            <Link
              href="https://www.linkedin.com/in/dileep-kushwaha-6457711a5/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
              title="LinkedIn Profile"
            >
              <Linkedin className="h-5 w-5" />
              <span>LinkedIn</span>
            </Link>

            <Link
              href="mailto:dileepkushwaha8090@gmail.com"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
              title="Email"
            >
              <Mail className="h-5 w-5" />
              <span>Contact</span>
            </Link>
          </div>

          <div className="text-center md:text-right">
            <p className="font-semibold text-foreground">Dileep</p>
            <p className="text-xs">Full Stack Developer</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs">
          <p>
            © 2026 KnowledgeSync. All rights reserved. | House of Edtech
            Assignment
          </p>
        </div>
      </div>
    </footer>
  );
}
