import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, Save, RotateCcw } from "lucide-react";

const defaultConfig = {
  orgName: "Syedom Labs",
  title: "Certificate of Completion",
  subtitle: "Internship Program",
  bodyText: "This is to certify that",
  completionText: "has successfully completed the",
  durationText: "3-Month Intensive Internship",
  signatory1Name: "Syed Hasnat Ali",
  signatory1Title: "CEO & Founder",
  signatory2Name: "M. Sohaib Ali",
  signatory2Title: "CTO",
  borderColor: "#2563eb",
  accentColor: "#1e40af",
  bgColor: "#ffffff",
  textColor: "#1a1a2e",
};

const CertificateEditor = () => {
  const [config, setConfig] = useState(defaultConfig);

  const update = (key: string, value: string) => setConfig(p => ({ ...p, [key]: value }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificate Editor</h1>
            <p className="text-muted-foreground text-sm mt-1">Customize certificate template fields</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfig(defaultConfig)}>
              <RotateCcw className="h-4 w-4 mr-2" />Reset
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />Save Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input value={config.orgName} onChange={e => update("orgName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Certificate Title</Label>
                <Input value={config.title} onChange={e => update("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={config.subtitle} onChange={e => update("subtitle", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Body Prefix</Label>
                <Input value={config.bodyText} onChange={e => update("bodyText", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Completion Text</Label>
                <Input value={config.completionText} onChange={e => update("completionText", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration Text</Label>
                <Input value={config.durationText} onChange={e => update("durationText", e.target.value)} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Signatory 1 Name</Label>
                  <Input value={config.signatory1Name} onChange={e => update("signatory1Name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Signatory 1 Title</Label>
                  <Input value={config.signatory1Title} onChange={e => update("signatory1Title", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Signatory 2 Name</Label>
                  <Input value={config.signatory2Name} onChange={e => update("signatory2Name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Signatory 2 Title</Label>
                  <Input value={config.signatory2Title} onChange={e => update("signatory2Title", e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config.borderColor} onChange={e => update("borderColor", e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                    <Input value={config.borderColor} onChange={e => update("borderColor", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config.accentColor} onChange={e => update("accentColor", e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                    <Input value={config.accentColor} onChange={e => update("accentColor", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config.textColor} onChange={e => update("textColor", e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                    <Input value={config.textColor} onChange={e => update("textColor", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="aspect-[1.414/1] rounded-lg p-6 flex flex-col items-center justify-between text-center relative overflow-hidden"
                style={{
                  backgroundColor: config.bgColor,
                  border: `3px solid ${config.borderColor}`,
                  color: config.textColor,
                }}
              >
                {/* Decorative borders */}
                <div className="absolute inset-2 border rounded-lg pointer-events-none" style={{ borderColor: config.borderColor + "40" }} />
                <div className="absolute inset-4 border rounded pointer-events-none" style={{ borderColor: config.accentColor + "30" }} />

                {/* Top */}
                <div className="mt-4 z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <img src="/images/syedom-labs-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
                    <span className="text-sm font-bold" style={{ color: config.accentColor }}>{config.orgName}</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-wide" style={{ color: config.borderColor }}>{config.title}</h2>
                  <p className="text-[10px] uppercase tracking-widest mt-0.5 opacity-60">{config.subtitle}</p>
                </div>

                {/* Body */}
                <div className="z-10 space-y-2">
                  <p className="text-[10px] opacity-70">{config.bodyText}</p>
                  <p className="text-base font-bold" style={{ color: config.accentColor }}>John Doe</p>
                  <p className="text-[10px] opacity-70">{config.completionText}</p>
                  <p className="text-xs font-semibold" style={{ color: config.borderColor }}>Web Development</p>
                  <p className="text-[10px] opacity-60">{config.durationText}</p>
                  <p className="text-[10px] opacity-50 mt-1">Score: 85% · Tasks: 8/8</p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between w-full px-6 z-10 mb-2">
                  <div className="text-center">
                    <img src="/images/syed_hasnat_ali_sign.png" alt="" className="h-6 mx-auto mb-1 opacity-80" />
                    <div className="border-t pt-0.5" style={{ borderColor: config.textColor + "30" }}>
                      <p className="text-[9px] font-semibold">{config.signatory1Name}</p>
                      <p className="text-[8px] opacity-60">{config.signatory1Title}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <img src="/images/m.sohaib_ali_sign.png" alt="" className="h-6 mx-auto mb-1 opacity-80" />
                    <div className="border-t pt-0.5" style={{ borderColor: config.textColor + "30" }}>
                      <p className="text-[9px] font-semibold">{config.signatory2Name}</p>
                      <p className="text-[8px] opacity-60">{config.signatory2Title}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="z-10">
                  <p className="text-[8px] opacity-40 font-mono">CERT-XXXXXX · Verify at syedomlabs.com/verify</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CertificateEditor;
