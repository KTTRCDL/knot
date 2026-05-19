use std::io;
use std::path::{Path, PathBuf};
use tokio::fs;

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    read_file_impl(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    write_file_impl(Path::new(&path), &content)
        .await
        .map_err(|e| e.to_string())
}

async fn read_file_impl(path: &Path) -> io::Result<String> {
    fs::read_to_string(path).await
}

async fn write_file_impl(path: &Path, content: &str) -> io::Result<()> {
    let tmp = tmp_path_for(path);
    fs::write(&tmp, content).await?;
    fs::rename(&tmp, path).await
}

fn tmp_path_for(path: &Path) -> PathBuf {
    let suffix = format!(".knot-tmp.{}", uuid::Uuid::new_v4().simple());
    let mut s = path.as_os_str().to_owned();
    s.push(&suffix);
    PathBuf::from(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn read_returns_file_contents() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("a.md");
        std::fs::write(&p, "# hi").unwrap();
        let got = read_file_impl(&p).await.unwrap();
        assert_eq!(got, "# hi");
    }

    #[tokio::test]
    async fn read_missing_file_errors() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("missing.md");
        assert!(read_file_impl(&p).await.is_err());
    }

    #[tokio::test]
    async fn write_creates_file_with_content() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("b.md");
        write_file_impl(&p, "hello").await.unwrap();
        let got = std::fs::read_to_string(&p).unwrap();
        assert_eq!(got, "hello");
    }

    #[tokio::test]
    async fn write_is_atomic_via_temp_rename() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("c.md");
        std::fs::write(&p, "original").unwrap();
        write_file_impl(&p, "new").await.unwrap();
        let got = std::fs::read_to_string(&p).unwrap();
        assert_eq!(got, "new");
        // No leftover temp file in the parent directory
        let leftovers: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|e| e.file_name().to_string_lossy().starts_with("c.md.knot-tmp"))
            .collect();
        assert!(leftovers.is_empty(), "leftover temp files: {leftovers:?}");
    }
}
