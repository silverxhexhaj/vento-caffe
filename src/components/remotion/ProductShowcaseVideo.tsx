"use client";

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
} from "remotion";

// Image paths
const LOGO_IMAGE = "/images/logo-video.png";
const CLASSIC_CIALDE_IMAGE = "/images/products/classic-cialde-1.png";
const DECAFFEINATO_CIALDE_IMAGE = "/images/products/decaffeinato-cialde-1.png";
const ESPRESSO_MACHINE_IMAGE = "/images/products/espresso-machine-1.png";

// ============================================
// Scene 1: Intro Scene (frames 0-60, ~2s)
// ============================================
const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const fadeOut = interpolate(frame, [50, 60], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Logo Image */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: "center",
        }}
      >
        <Img
          src={LOGO_IMAGE}
          style={{
            width: 280,
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          opacity: taglineOpacity,
          color: "#888",
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: 1,
        }}
      >
        Premium Italian Coffee, Made Simple
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// Scene 2: Products Scene (frames 60-210, ~5s)
// ============================================
const ProductsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [135, 150], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const titleSlide = spring({
    frame,
    fps,
    config: { damping: 20 },
  });

  const products = [
    { name: "Classic", image: CLASSIC_CIALDE_IMAGE, delay: 20 },
    { name: "Decaffeinato", image: DECAFFEINATO_CIALDE_IMAGE, delay: 35 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Section Title */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          transform: `translateY(${interpolate(titleSlide, [0, 1], [-30, 0])}px)`,
          opacity: titleSlide,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#8b4513",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Our Products
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Premium Cialde Boxes
        </div>
      </div>

      {/* Product Cards */}
      <div
        style={{
          display: "flex",
          gap: 80,
          marginTop: 20,
        }}
      >
        {products.map((product) => {
          const cardSpring = spring({
            frame: frame - product.delay,
            fps,
            config: { damping: 15 },
          });

          const cardOpacity = interpolate(
            frame,
            [product.delay, product.delay + 20],
            [0, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          return (
            <div
              key={product.name}
              style={{
                transform: `scale(${cardSpring}) translateY(${interpolate(cardSpring, [0, 1], [40, 0])}px)`,
                opacity: cardOpacity,
                textAlign: "center",
              }}
            >
              {/* Product Image with background */}
              <div
                style={{
                  width: 220,
                  height: 260,
                  background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                  marginBottom: 20,
                  padding: 16,
                  border: "1px solid rgba(139, 69, 19, 0.2)",
                }}
              >
                <Img
                  src={product.image}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>
                {product.name} Box
              </div>
              <div style={{ color: "#888", fontSize: 14, marginTop: 6 }}>
                150 cialde + kit included
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Tag */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          opacity: interpolate(frame, [60, 80], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #8b4513 0%, #a0522d 100%)",
            color: "#fff",
            fontSize: 28,
            fontWeight: 700,
            padding: "14px 40px",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(139, 69, 19, 0.4)",
          }}
        >
          Starting at 5,500 Lekë/month
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// Scene 3: Free Machine Offer (frames 210-360, ~5s)
// ============================================
const FreeMachineScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [135, 150], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const machineSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const badgeSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  const textOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const benefitsOpacity = interpolate(frame, [75, 95], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Left: Machine Image */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          transform: `scale(${machineSpring})`,
        }}
      >
        {/* Machine Container with glow */}
        <div
          style={{
            width: 300,
            height: 380,
            background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(139, 69, 19, 0.15)",
            padding: 20,
            position: "relative",
            border: "1px solid rgba(139, 69, 19, 0.2)",
          }}
        >
          <Img
            src={ESPRESSO_MACHINE_IMAGE}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* FREE Badge */}
        <div
          style={{
            position: "absolute",
            top: -25,
            right: -35,
            transform: `scale(${badgeSpring}) rotate(-12deg)`,
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "#fff",
            fontSize: 36,
            fontWeight: 800,
            padding: "14px 28px",
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.5)",
          }}
        >
          FREE
        </div>
      </div>

      {/* Right: Text */}
      <div
        style={{
          position: "absolute",
          right: "8%",
          width: "42%",
          textAlign: "left",
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#22c55e",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 12,
            }}
          >
            Special Offer
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Get a FREE
            <br />
            Espresso Machine
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#888",
            }}
          >
            With monthly cialde subscription
          </div>
        </div>

        {/* Benefits */}
        <div style={{ opacity: benefitsOpacity }}>
          {["No contracts", "No hidden fees", "Cancel anytime"].map((benefit, i) => (
            <div
              key={benefit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                opacity: interpolate(
                  frame,
                  [80 + i * 10, 95 + i * 10],
                  [0, 1],
                  { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
                ),
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#22c55e",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
              <div style={{ color: "#ccc", fontSize: 18 }}>{benefit}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// Scene 4: How to Buy Steps (frames 360-630, ~9s)
// ============================================
const HowToBuyScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [255, 270], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 20 },
  });

  const steps = [
    {
      number: "1",
      title: "Choose Your Cialde",
      description: "Select Classic or Decaffeinato",
      icon: "☕",
      startFrame: 30,
    },
    {
      number: "2",
      title: "Add to Cart",
      description: "Pick your quantity",
      icon: "🛒",
      startFrame: 85,
    },
    {
      number: "3",
      title: "Order via WhatsApp",
      description: "Quick and easy checkout",
      icon: "💬",
      startFrame: 140,
    },
    {
      number: "4",
      title: "Delivered to Your Door",
      description: "2-3 business days",
      icon: "📦",
      startFrame: 195,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${interpolate(titleOpacity, [0, 1], [-20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#8b4513",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          How It Works
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Easy as 1-2-3-4
        </div>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginTop: 60,
        }}
      >
        {steps.map((step, index) => {
          const isActive = frame >= step.startFrame;
          const stepProgress = spring({
            frame: frame - step.startFrame,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          const stepOpacity = interpolate(
            frame,
            [step.startFrame, step.startFrame + 20],
            [0, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          // Connection line to next step
          const lineProgress =
            index < steps.length - 1
              ? interpolate(
                  frame,
                  [step.startFrame + 30, steps[index + 1].startFrame],
                  [0, 1],
                  { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
                )
              : 0;

          return (
            <div
              key={step.number}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 180,
                opacity: stepOpacity,
                transform: `scale(${stepProgress}) translateY(${interpolate(stepProgress, [0, 1], [30, 0])}px)`,
                position: "relative",
              }}
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 45,
                    left: "100%",
                    width: 32,
                    height: 4,
                    background: "#333",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${lineProgress * 100}%`,
                      height: "100%",
                      background: "#8b4513",
                    }}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: isActive
                    ? "linear-gradient(135deg, #8b4513 0%, #a0522d 100%)"
                    : "#2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  marginBottom: 16,
                  boxShadow: isActive
                    ? "0 8px 24px rgba(139, 69, 19, 0.4)"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {step.icon}
              </div>

              {/* Step Number */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#8b4513",
                  marginBottom: 8,
                }}
              >
                Step {step.number}
              </div>

              {/* Step Title */}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {step.title}
              </div>

              {/* Step Description */}
              <div
                style={{
                  fontSize: 14,
                  color: "#888",
                  textAlign: "center",
                }}
              >
                {step.description}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// Scene 5: Call to Action (frames 630-750, ~4s)
// ============================================
const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15 },
  });

  const buttonSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  const productFloat = Math.sin(frame * 0.08) * 8;
  const pulsePhase = Math.sin(frame * 0.15) * 0.5 + 0.5;

  const leftProductOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const rightProductOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 69, 19, 0.2) 0%, transparent 70%)",
          opacity: 0.5 + pulsePhase * 0.3,
        }}
      />

      {/* Decorative Product Images - Left */}
      <div
        style={{
          position: "absolute",
          left: "5%",
          top: "50%",
          transform: `translateY(calc(-50% + ${productFloat}px))`,
          opacity: leftProductOpacity * 0.6,
        }}
      >
        <div
          style={{
            width: 140,
            height: 170,
            background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            border: "1px solid rgba(139, 69, 19, 0.15)",
          }}
        >
          <Img
            src={CLASSIC_CIALDE_IMAGE}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* Decorative Product Images - Right */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "50%",
          transform: `translateY(calc(-50% + ${-productFloat}px))`,
          opacity: rightProductOpacity * 0.6,
        }}
      >
        <div
          style={{
            width: 140,
            height: 170,
            background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            border: "1px solid rgba(139, 69, 19, 0.15)",
          }}
        >
          <Img
            src={ESPRESSO_MACHINE_IMAGE}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          textAlign: "center",
          transform: `scale(${titleSpring})`,
          zIndex: 10,
        }}
      >
        {/* Logo at top */}
        <div
          style={{
            marginBottom: 20,
            opacity: interpolate(frame, [5, 25], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        >
          <Img
            src={LOGO_IMAGE}
            style={{
              width: 120,
              height: "auto",
              objectFit: "contain",
              margin: "0 auto",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#22c55e",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          Ready to Start?
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Start Your Subscription
          <br />
          Today
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#888",
            marginBottom: 36,
          }}
        >
          Premium coffee + FREE machine delivered monthly
        </div>

        {/* CTA Button */}
        <div
          style={{
            transform: `scale(${buttonSpring})`,
            display: "inline-block",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #8b4513 0%, #a0522d 100%)",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              padding: "18px 48px",
              borderRadius: 12,
              boxShadow: `0 8px 32px rgba(139, 69, 19, ${0.4 + pulsePhase * 0.2})`,
              cursor: "pointer",
            }}
          >
            Shop Now
          </div>
        </div>

        {/* Hint */}
        <div
          style={{
            marginTop: 28,
            fontSize: 14,
            color: "#666",
            opacity: interpolate(frame, [50, 70], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        >
          Click below to explore our products
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// Main Composition
// ============================================
export const ProductShowcaseVideo = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Subtle gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(160, 82, 45, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* Scene 1: Intro (frames 0-60) */}
      <Sequence from={0} durationInFrames={60}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Products (frames 60-210) */}
      <Sequence from={60} durationInFrames={150}>
        <ProductsScene />
      </Sequence>

      {/* Scene 3: Free Machine Offer (frames 210-360) */}
      <Sequence from={210} durationInFrames={150}>
        <FreeMachineScene />
      </Sequence>

      {/* Scene 4: How to Buy (frames 360-630) */}
      <Sequence from={360} durationInFrames={270}>
        <HowToBuyScene />
      </Sequence>

      {/* Scene 5: CTA (frames 630-750) */}
      <Sequence from={630} durationInFrames={120}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Export composition configuration
export const productShowcaseConfig = {
  id: "ProductShowcase",
  component: ProductShowcaseVideo,
  durationInFrames: 750, // 25 seconds at 30fps
  fps: 30,
  width: 1280,
  height: 720,
};
