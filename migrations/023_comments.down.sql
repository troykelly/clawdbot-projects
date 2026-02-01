-- Migration 023: Comments and presence - Rollback

DROP TRIGGER IF EXISTS work_item_comment_updated_at ON work_item_comment;
DROP FUNCTION IF EXISTS update_work_item_comment_updated_at();
DROP TABLE IF EXISTS user_presence;
DROP TABLE IF EXISTS work_item_comment_reaction;
DROP TABLE IF EXISTS work_item_comment;
