"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Hook to detect keyboard visibility on mobile
 * Uses visualViewport API for accurate detection on iOS Safari
 */
const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const viewport = window.visualViewport;
        // Keyboard is visible when visual viewport height is significantly smaller than window height
        const heightDiff = window.innerHeight - viewport.height;
        const isVisible = heightDiff > 100; // Threshold to detect keyboard
        setIsKeyboardVisible(isVisible);
        setKeyboardHeight(isVisible ? heightDiff : 0);
      }
    };

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
      // Initial check
      handleResize();
    }

    return () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
};

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  preventClose?: boolean;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveDialogContext = React.createContext<{
  isMobile: boolean;
  preventClose?: boolean;
}>({
  isMobile: false,
  preventClose: false,
});

/**
 * Responsive dialog that renders as a Drawer on mobile and Dialog on desktop
 */
export const ResponsiveDialog = ({
  open,
  onOpenChange,
  children,
  preventClose,
}: ResponsiveDialogProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing if preventClose is true
    if (!newOpen && preventClose) {
      return;
    }
    onOpenChange(newOpen);
  };

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile, preventClose }}>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile, preventClose }}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
};

export const ResponsiveDialogContent = ({
  className,
  children,
}: ResponsiveDialogContentProps) => {
  const { isMobile, preventClose } = React.useContext(ResponsiveDialogContext);
  const { isKeyboardVisible } = useKeyboardVisible();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn("max-h-[85svh]", isKeyboardVisible && "max-h-[50svh]", className)}
        onInteractOutside={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
      >
        {/*
          Mobile drawer content wrapper:
          - Max height applied to DrawerContent itself to cap the drawer size
          - Overflow handling allows scrolling when content exceeds available space
          - pb-safe adds padding for iOS home indicator
        */}
        <div className="overflow-y-auto px-4 pb-4 pb-safe">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      className={`max-h-[85vh] overflow-y-auto ${className ?? ""}`}
      onInteractOutside={(event) => {
        if (preventClose) {
          event.preventDefault();
        }
      }}
      onEscapeKeyDown={(event) => {
        if (preventClose) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </DialogContent>
  );
};

export const ResponsiveDialogHeader = ({
  children,
  className,
}: ResponsiveDialogHeaderProps) => {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    // Default to text-left unless className specifies otherwise (e.g., text-center)
    const hasTextAlign = className?.includes("text-");
    return (
      <DrawerHeader className={hasTextAlign ? className : `text-left ${className ?? ""}`}>
        {children}
      </DrawerHeader>
    );
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
};

export const ResponsiveDialogTitle = ({
  children,
  className,
}: ResponsiveDialogTitleProps) => {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
};

export const ResponsiveDialogDescription = ({
  children,
  className,
}: ResponsiveDialogDescriptionProps) => {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerDescription className={className}>{children}</DrawerDescription>
    );
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
};

export const ResponsiveDialogFooter = ({
  children,
  className,
}: ResponsiveDialogFooterProps) => {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    // Override mt-auto from DrawerFooter to keep footer close to content
    return (
      <DrawerFooter className={cn("mt-0", className)}>
        {children}
      </DrawerFooter>
    );
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
};
