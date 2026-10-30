<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The BarterKartale UI lives in `src/components/app/` (ported from the original Bolt app, plain CSS classes in `src/styles.css`); each URL route renders `BarterApp` with an `initialView` so the single-page view switcher keeps working with real routes.
- Admin powers come from `profiles.role` (not client-writable) checked inside SECURITY DEFINER functions via `is_super_admin`; never grant clients write access to `profiles`.
