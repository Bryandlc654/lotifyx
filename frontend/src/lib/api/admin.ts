import { API_URL, authFetch, multipartAuth } from "./client";
import type { AdminUser, Plan, Faq, FaqCategory, RoleWithPerms, Permission, Lead, Tutorial, AppEvent, HelpArticle, PressArticle, SupportTicket, BlogPost, Banner, Marquee, Testimonial, SecondaryBanner, BackingLogo, Review } from "./common";

export async function getFaqs(category?: string): Promise<Faq[]> { const qs = category ? `?category=${encodeURIComponent(category)}` : ""; const res = await fetch(`${API_URL}/faqs${qs}`); if (!res.ok) throw new Error("Error"); return res.json(); }

export async function getFaqCategories(): Promise<FaqCategory[]> { const res = await fetch(`${API_URL}/faq-categories`); if (!res.ok) throw new Error("Error"); return res.json(); }

export async function createLead(dto: { first_name: string; last_name: string; email: string; phone?: string; message: string }): Promise<Lead> {
  const res = await fetch(`${API_URL}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API_URL}/blog`);
  if (!res.ok) throw new Error("Error al obtener artículos");
  return res.json();
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/${slug}`);
  if (!res.ok) throw new Error("Error al obtener artículo");
  return res.json();
}

export async function createSupportTicket(dto: Partial<SupportTicket>): Promise<SupportTicket> {
  const res = await fetch(`${API_URL}/support/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al crear ticket");
  return res.json();
}

export async function getSupportTicket(ticketNumber: string): Promise<SupportTicket> {
  const res = await fetch(`${API_URL}/support/tickets/${ticketNumber}`);
  if (!res.ok) throw new Error("Ticket no encontrado");
  return res.json();
}

export async function getEvents(): Promise<AppEvent[]> {
  const res = await fetch(`${API_URL}/events`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getTutorials(): Promise<Tutorial[]> {
  const res = await fetch(`${API_URL}/tutorials`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getHelpArticles(): Promise<HelpArticle[]> {
  const res = await fetch(`${API_URL}/help`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getPressArticles(): Promise<PressArticle[]> {
  const res = await fetch(`${API_URL}/press`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminUsers(params?: {
  search?: string; role?: string; status?: string; is_admin?: string; page?: number; limit?: number;
}): Promise<{ data: AdminUser[]; total: number; page: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.role) qs.set("role", params.role);
  if (params?.status) qs.set("status", params.status);
  if (params?.is_admin) qs.set("is_admin", params.is_admin);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const res = await authFetch(`${API_URL}/admin/users?${qs.toString()}`);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`);
  if (!res.ok) throw new Error("Usuario no encontrado");
  return res.json();
}

export async function createAdminUser(dto: any): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function updateAdminUser(id: string, dto: any): Promise<AdminUser> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar usuario");
}

export async function toggleUserActive(id: string): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/users/${id}/toggle-active`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al cambiar estado");
  return res.json();
}

export async function getAdminRoles(): Promise<{ id: string; name: string }[]> {
  const res = await authFetch(`${API_URL}/admin/users/roles`);
  if (!res.ok) throw new Error("Error al obtener roles");
  return res.json();
}

export async function getRbacRoles(): Promise<RoleWithPerms[]> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createRbacRole(dto: { name: string; description?: string }): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

export async function deleteRbacRole(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await authFetch(`${API_URL}/admin/rbac/permissions`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function assignPermission(roleId: string, permissionId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/roles/${roleId}/permissions`, {
    method: "POST", body: JSON.stringify({ permission_id: permissionId }),
  });
  if (!res.ok) throw new Error("Error");
}

export async function revokePermission(rpId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/permissions/${rpId}/revoke`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function seedPermissions(): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/rbac/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Error");
}

export async function getAdminOrders(status?: string, page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/admin/orders${qs}`);
  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
}

export async function approveOrderPayment(id: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al aprobar pago");
  return res.json();
}

export async function rejectOrderPayment(id: string, motivo: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error("Error al rechazar pago");
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await authFetch(`${API_URL}/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Error al actualizar estado");
  return res.json();
}

export async function adminGetAuctions(): Promise<any[]> {
  const res = await authFetch(`${API_URL}/admin/auctions`);
  if (!res.ok) return [];
  return res.json();
}

export async function adminGetEndedAuctions(): Promise<any[]> {
  const res = await authFetch(`${API_URL}/admin/auctions/ended`);
  if (!res.ok) return [];
  return res.json();
}

export async function adminCloseAuction(auctionId: string): Promise<any> {
  const res = await authFetch(`${API_URL}/admin/auctions/${auctionId}/close`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}

export async function getAdminReviews(page: number = 1, limit: number = 20): Promise<{ data: Review[]; total: number; page: number; totalPages: number }> {
  const res = await authFetch(`${API_URL}/admin/reviews?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function adminDeleteReview(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar reseña");
}

export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_URL}/plans`);
  if (!res.ok) throw new Error("Error al obtener planes");
  return res.json();
}

export async function createPlan(dto: { name: string; description?: string; price: number; max_products: number; max_featured?: number; duration_days?: number; commission?: number }): Promise<Plan> {
  const res = await authFetch(`${API_URL}/plans`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error((await res.json().catch(()=>({message:"Error"}))).message);
  return res.json();
}

export async function updatePlan(id: string, dto: Partial<Plan>): Promise<Plan> {
  const res = await authFetch(`${API_URL}/plans/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar plan");
  return res.json();
}

export async function deletePlan(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/plans/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar plan");
}

export async function getAdminClaims() {
  const res = await authFetch(`${API_URL}/admin/orders/claims`);
  if (!res.ok) throw new Error("Error al cargar reclamos");
  return res.json();
}

export async function updateClaimStatus(id: string, status: string) {
  const res = await authFetch(`${API_URL}/admin/orders/claims/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Error al actualizar reclamo");
  return res.json();
}

export async function getAdminDashboard() {
  const res = await authFetch(`${API_URL}/admin/dashboard`);
  if (!res.ok) throw new Error("Error al cargar dashboard admin");
  return res.json();
}

export async function getAuditLogs(filters?: { action?: string; entity?: string }) {
  const params = new URLSearchParams();
  if (filters?.action) params.set("action", filters.action);
  if (filters?.entity) params.set("entity", filters.entity);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/admin/audit${qs}`);
  if (!res.ok) throw new Error("Error al cargar auditoría");
  return res.json();
}

export async function getSettings(): Promise<Record<string, string>> {
  const res = await authFetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error("Error al obtener configuración");
  return res.json();
}

export async function updateSettings(data: Record<string, string>): Promise<void> {
  const res = await authFetch(`${API_URL}/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar configuración");
}

export async function getAdminNewsletter(): Promise<any[]> {
  const res = await authFetch(`${API_URL}/admin/newsletter`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/newsletter/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}

export async function exportNewsletterCsv() {
  const res = await authFetch(`${API_URL}/admin/newsletter/export`);
  if (!res.ok) throw new Error("Error al exportar");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "suscriptores-newsletter.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function getAdminSupportTickets(): Promise<SupportTicket[]> {
  const res = await authFetch(`${API_URL}/admin/support`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function updateSupportTicket(id: string, dto: Partial<SupportTicket>): Promise<SupportTicket> {
  const res = await authFetch(`${API_URL}/admin/support/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteSupportTicket(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/support/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar ticket");
}

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  const res = await authFetch(`${API_URL}/admin/blog`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminBlogPost(id: string): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createBlogPost(dto: Partial<BlogPost>): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear artículo");
  return res.json();
}

export async function updateBlogPost(id: string, dto: Partial<BlogPost>): Promise<BlogPost> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar artículo");
  return res.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/blog/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar artículo");
}

export async function getAdminTutorials(): Promise<Tutorial[]> {
  const res = await authFetch(`${API_URL}/admin/tutorials`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminTutorial(id: string): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createTutorial(dto: Partial<Tutorial>): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear tutorial");
  return res.json();
}

export async function updateTutorial(id: string, dto: Partial<Tutorial>): Promise<Tutorial> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar tutorial");
  return res.json();
}

export async function deleteTutorial(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/tutorials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar tutorial");
}

export async function getAdminEvents(): Promise<AppEvent[]> {
  const res = await authFetch(`${API_URL}/admin/events`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminEvent(id: string): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createEvent(dto: Partial<AppEvent>): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear evento");
  return res.json();
}

export async function updateEvent(id: string, dto: Partial<AppEvent>): Promise<AppEvent> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar evento");
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar evento");
}

export async function getAdminHelpArticles(): Promise<HelpArticle[]> {
  const res = await authFetch(`${API_URL}/admin/help`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function getAdminHelpArticle(id: string): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createHelpArticle(dto: Partial<HelpArticle>): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear artículo");
  return res.json();
}

export async function updateHelpArticle(id: string, dto: Partial<HelpArticle>): Promise<HelpArticle> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar artículo");
  return res.json();
}

export async function deleteHelpArticle(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/help/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar artículo");
}

export async function getAdminPressArticles(): Promise<PressArticle[]> {
  const res = await authFetch(`${API_URL}/admin/press`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createPressArticle(dto: Partial<PressArticle>): Promise<PressArticle> {
  const res = await authFetch(`${API_URL}/admin/press`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al crear nota");
  return res.json();
}

export async function updatePressArticle(id: string, dto: Partial<PressArticle>): Promise<PressArticle> {
  const res = await authFetch(`${API_URL}/admin/press/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar nota");
  return res.json();
}

export async function deletePressArticle(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/admin/press/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar nota");
}

export async function getFaqsAdmin(): Promise<Faq[]> {
  const res = await authFetch(`${API_URL}/faqs/admin`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createFaq(dto: { category: string; question: string; answer: string }): Promise<Faq> {
  const res = await authFetch(`${API_URL}/faqs`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function updateFaq(id: string, dto: Partial<Faq>): Promise<Faq> {
  const res = await authFetch(`${API_URL}/faqs/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/faqs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function getFaqCategoriesAdmin(): Promise<FaqCategory[]> {
  const res = await authFetch(`${API_URL}/faq-categories/admin`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function createFaqCategory(dto: { name: string; slug?: string; description?: string }): Promise<FaqCategory> {
  const res = await authFetch(`${API_URL}/faq-categories`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function updateFaqCategory(id: string, dto: Partial<FaqCategory>): Promise<FaqCategory> {
  const res = await authFetch(`${API_URL}/faq-categories/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteFaqCategory(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/faq-categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function getLeads(): Promise<Lead[]> {
  const res = await authFetch(`${API_URL}/leads`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function deleteLead(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/leads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error");
}

export async function getBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_URL}/banners`);
  if (!res.ok) throw new Error("Error al obtener banners");
  return res.json();
}

export async function createBanner(title: string, file: File): Promise<Banner> {
  return multipartAuth(`${API_URL}/banners`, "POST", { title, image: file });
}

export async function updateBanner(id: string, title: string, file?: File): Promise<Banner> {
  return multipartAuth(`${API_URL}/banners/${id}`, "PUT", { title, ...(file ? { image: file } : {}) });
}

export async function deleteBanner(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/banners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar banner");
}

export async function getMarquees(): Promise<Marquee[]> {
  const res = await fetch(`${API_URL}/marquees`);
  if (!res.ok) throw new Error("Error al obtener logos");
  return res.json();
}

export async function createMarquee(name: string, file: File): Promise<Marquee> {
  return multipartAuth(`${API_URL}/marquees`, "POST", { name, image: file });
}

export async function updateMarquee(id: string, name: string, file?: File): Promise<Marquee> {
  return multipartAuth(`${API_URL}/marquees/${id}`, "PUT", { name, ...(file ? { image: file } : {}) });
}

export async function deleteMarquee(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/marquees/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar logo");
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await fetch(`${API_URL}/testimonials`);
  if (!res.ok) throw new Error("Error al obtener testimonios");
  return res.json();
}

export async function createTestimonial(dto: { stars: number; text: string; name: string; cargo: string }): Promise<Testimonial> {
  const res = await authFetch(`${API_URL}/testimonials`, {
    method: "POST", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al crear testimonio");
  return res.json();
}

export async function updateTestimonial(id: string, dto: Partial<{ stars: number; text: string; name: string; cargo: string; is_active: boolean }>): Promise<Testimonial> {
  const res = await authFetch(`${API_URL}/testimonials/${id}`, {
    method: "PUT", body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Error al actualizar testimonio");
  return res.json();
}

export async function deleteTestimonial(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/testimonials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar testimonio");
}

export async function reorderTestimonials(ids: string[]): Promise<void> {
  const res = await authFetch(`${API_URL}/testimonials/reorder`, {
    method: "PUT", body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Error al reordenar testimonios");
}

export async function getSecondaryBanners(type?: string): Promise<SecondaryBanner[]> {
  const qs = type ? `?type=${type}` : "";
  const res = await fetch(`${API_URL}/secondary-banners${qs}`);
  if (!res.ok) throw new Error("Error al obtener banners");
  return res.json();
}

export async function createSecondaryBanner(dto: { title: string; subtitle?: string; type: string; link_url?: string; button_text?: string }, file: File): Promise<SecondaryBanner> {
  return multipartAuth(`${API_URL}/secondary-banners`, "POST", { ...dto, image: file });
}

export async function updateSecondaryBanner(id: string, dto: { title?: string; subtitle?: string; link_url?: string; button_text?: string; is_active?: boolean; type?: string }, file?: File): Promise<SecondaryBanner> {
  return multipartAuth(`${API_URL}/secondary-banners/${id}`, "PUT", { ...dto, ...(file ? { image: file } : {}) });
}

export async function deleteSecondaryBanner(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/secondary-banners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar banner");
}

export async function getBackingLogos(): Promise<BackingLogo[]> {
  const res = await fetch(`${API_URL}/backing`);
  if (!res.ok) throw new Error("Error al obtener logos");
  return res.json();
}

export async function createBackingLogo(name: string, file: File): Promise<BackingLogo> {
  return multipartAuth(`${API_URL}/backing`, "POST", { name, image: file });
}

export async function updateBackingLogo(id: string, dto: { name?: string; is_active?: boolean }, file?: File): Promise<BackingLogo> {
  return multipartAuth(`${API_URL}/backing/${id}`, "PUT", { ...dto, ...(file ? { image: file } : {}) });
}

export async function deleteBackingLogo(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/backing/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar logo");
}
