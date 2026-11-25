// Catalogue photos with a coloured backdrop (blue squares, water, studio grey) look like boxes
// on the night pages. Build: swiftc -O -o photo_bg photo_bg.swift (macOS 14 or later).
// photo_bg scan <files...>        : how much backdrop colour sits just inside each photo's content
// photo_bg white <in> <out.jpg>   : cut the subject out (macOS Vision) and put it on pure white
import AppKit
import CoreImage
import Foundation
import Vision

func cgImage(_ path: String) -> CGImage? {
    guard let img = NSImage(contentsOfFile: path) else { return nil }
    var rect = CGRect(origin: .zero, size: img.size)
    return img.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func rgba(_ cg: CGImage) -> (UnsafeMutablePointer<UInt8>, Int, Int) {
    let w = cg.width, h = cg.height
    let buf = UnsafeMutablePointer<UInt8>.allocate(capacity: w * h * 4)
    let ctx = CGContext(data: buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                        space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
    return (buf, w, h)
}

func scan(_ path: String) {
    guard let cg = cgImage(path) else { print("cannot read", path); return }
    let (p, w, h) = rgba(cg)
    defer { p.deallocate() }
    func isWhite(_ x: Int, _ y: Int) -> Bool {
        let i = (y * w + x) * 4
        return min(p[i], p[i + 1], p[i + 2]) >= 232
    }
    // the box around everything that is not white padding
    var x0 = w, y0 = h, x1 = 0, y1 = 0
    for y in 0..<h { for x in 0..<w where !isWhite(x, y) { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } }
    guard x1 > x0 else { print(path, "blank"); return }
    // a thin ring just inside that box: a backdrop shows up as colour all around it
    let ring = max(3, (x1 - x0) / 40)
    var colour = 0, total = 0, r = 0, g = 0, b = 0
    for y in y0...y1 {
        for x in x0...x1 where x < x0 + ring || x > x1 - ring || y < y0 + ring || y > y1 - ring {
            let i = (y * w + x) * 4
            if !isWhite(x, y) { colour += 1; r += Int(p[i]); g += Int(p[i + 1]); b += Int(p[i + 2]) }
            total += 1
        }
    }
    let n = max(colour, 1)
    print(String(format: "%-26@ box %4dx%-4d backdrop %3d%%  rgb(%d,%d,%d)", (path as NSString).lastPathComponent,
                 x1 - x0, y1 - y0, colour * 100 / total, r / n, g / n, b / n))
}

func onWhite(_ input: String, _ output: String) throws {
    guard let cg = cgImage(input) else { throw NSError(domain: "read", code: 1) }
    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: cg)
    try handler.perform([request])
    guard let result = request.results?.first else { print("no subject in", input); return }
    let mask = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
    let ci = CIImage(cgImage: cg)
    let maskImage = CIImage(cvPixelBuffer: mask)
    let white = CIImage(color: .white).cropped(to: ci.extent)
    let blend = CIFilter(name: "CIBlendWithMask")!
    blend.setValue(ci, forKey: kCIInputImageKey)
    blend.setValue(white, forKey: kCIInputBackgroundImageKey)
    blend.setValue(maskImage, forKey: kCIInputMaskImageKey)
    let context = CIContext()
    guard let out = blend.outputImage,
          let cgOut = context.createCGImage(out, from: ci.extent) else { throw NSError(domain: "blend", code: 2) }
    let rep = NSBitmapImageRep(cgImage: cgOut)
    let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.86])!
    try data.write(to: URL(fileURLWithPath: output))
    print("wrote", output, "instances", result.allInstances.count)
}

let args = CommandLine.arguments
if args.count >= 3 && args[1] == "scan" {
    for f in args[2...] { scan(f) }
} else if args.count == 4 && args[1] == "white" {
    do { try onWhite(args[2], args[3]) } catch { print("failed:", error) }
} else {
    print("usage: photo_bg scan <files...> | photo_bg white <in> <out.jpg>")
}
